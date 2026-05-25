/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.lingo.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.time.Instant;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCache;
import org.springframework.cache.interceptor.SimpleKey;

/** Unit tests for GenericRefreshCacheService focusing on locking and concurrency behavior. */
@ExtendWith(MockitoExtension.class)
class GenericRefreshCacheServiceTest {

  @Mock private CacheManager cacheManager;

  private Cache testCache;
  private MeterRegistry meterRegistry;

  private static final String TEST_CACHE_NAME = "testCache";

  @BeforeEach
  void setUp() {
    testCache = new ConcurrentMapCache(TEST_CACHE_NAME);
    meterRegistry = new SimpleMeterRegistry();
    when(cacheManager.getCache(TEST_CACHE_NAME)).thenReturn(testCache);
  }

  /**
   * Test that concurrent refresh attempts return cached values instead of executing in parallel.
   * This verifies that the AtomicBoolean lock prevents multiple simultaneous fetches.
   */
  @Test
  void testConcurrentRefreshReturnsCache() throws Exception {
    // Setup: Create a service that takes time to fetch
    AtomicInteger fetchCount = new AtomicInteger(0);
    CountDownLatch fetchStarted = new CountDownLatch(1);
    CountDownLatch secondRefreshAttempted = new CountDownLatch(1);
    CountDownLatch fetchCanComplete = new CountDownLatch(1);

    TestRefreshCacheService service =
        new TestRefreshCacheService(
            cacheManager,
            meterRegistry,
            () -> {
              int count = fetchCount.incrementAndGet();
              if (count == 1) {
                fetchStarted.countDown();
                // Wait for second refresh to attempt
                try {
                  secondRefreshAttempted.await(5, TimeUnit.SECONDS);
                  fetchCanComplete.await();
                } catch (InterruptedException e) {
                  Thread.currentThread().interrupt();
                  throw new RuntimeException(e);
                }
              }
              return "fresh-data";
            });

    // Pre-populate cache with old data
    testCache.put(SimpleKey.EMPTY, "cached-data");

    // Start first refresh in background thread
    ExecutorService executor = Executors.newFixedThreadPool(2);
    CompletableFuture<String> firstRefresh =
        CompletableFuture.supplyAsync(
            () -> {
              try {
                return service.refreshCache().get();
              } catch (Exception e) {
                throw new RuntimeException(e);
              }
            },
            executor);

    // Wait for first refresh to start fetching
    assertThat(fetchStarted.await(5, TimeUnit.SECONDS)).isTrue();

    // Start second refresh while first is still in progress
    CompletableFuture<String> secondRefresh =
        CompletableFuture.supplyAsync(
            () -> {
              try {
                CompletableFuture<String> result = service.refreshCache();
                secondRefreshAttempted.countDown();
                return result.get();
              } catch (Exception e) {
                throw new RuntimeException(e);
              }
            },
            executor);

    // Wait for second refresh to attempt
    assertThat(secondRefreshAttempted.await(5, TimeUnit.SECONDS)).isTrue();

    // Allow first refresh to complete
    fetchCanComplete.countDown();

    // Wait for both to complete
    String firstResult = firstRefresh.get(5, TimeUnit.SECONDS);
    String secondResult = secondRefresh.get(5, TimeUnit.SECONDS);

    // Verify: fetchFromSource was only called once (by first refresh)
    assertThat(fetchCount.get()).isEqualTo(1);

    // First refresh got the fresh data
    assertThat(firstResult).isEqualTo("fresh-data");

    // Second refresh got the cached data (didn't wait for first to complete)
    assertThat(secondResult).isEqualTo("cached-data");

    // Verify the skipped-refresh counter incremented exactly once
    assertThat(
            meterRegistry
                .counter(
                    GenericRefreshCacheService.SKIPPED_REFRESH_METRIC, "cache", TEST_CACHE_NAME)
                .count())
        .isEqualTo(1.0);

    executor.shutdown();
    assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
  }

  /**
   * Test that the lock is properly released when fetchFromSource throws an exception. This ensures
   * subsequent refresh attempts can proceed after a failure.
   */
  @Test
  void testLockReleasedOnException() throws Exception {
    // Setup: Service that throws exception on first call, succeeds on second
    AtomicInteger callCount = new AtomicInteger(0);
    TestRefreshCacheService service =
        new TestRefreshCacheService(
            cacheManager,
            meterRegistry,
            () -> {
              int count = callCount.incrementAndGet();
              if (count == 1) {
                throw new RuntimeException("Simulated fetch failure");
              }
              return "success-after-failure";
            });

    // Pre-populate cache with old data
    testCache.put(SimpleKey.EMPTY, "cached-data");

    // First refresh should fail
    String firstResult = service.refreshCache().get();

    // Should return cached data after exception
    assertThat(firstResult).isEqualTo("cached-data");

    // Verify lastSuccessfulRefresh was not updated (no timestamp should exist initially)
    Cache.ValueWrapper lastRefreshWrapper = testCache.get("lastSuccessfulRefresh");
    // Should be null or contain old timestamp if there was one

    // Second refresh should succeed (lock was released after exception)
    String secondResult = service.refreshCache().get();

    // Should get fresh data
    assertThat(secondResult).isEqualTo("success-after-failure");

    // Verify fetchFromSource was called twice
    assertThat(callCount.get()).isEqualTo(2);

    // Verify cache was updated with new data
    assertThat(testCache.get(SimpleKey.EMPTY, String.class)).isEqualTo("success-after-failure");

    // Verify lastSuccessfulRefresh was updated
    Instant lastRefresh = testCache.get("lastSuccessfulRefresh", Instant.class);
    assertThat(lastRefresh).isNotNull();
  }

  /**
   * Test that the lock is properly released when fetchFromSource throws a TimeoutException - the
   * exception path that callers like AllTasksService and JiraUserManagerService use when their
   * upstream WebClient call exceeds its configured timeout.
   */
  @Test
  void testLockReleasedOnTimeout() throws Exception {
    AtomicInteger callCount = new AtomicInteger(0);
    TestRefreshCacheService service =
        new TestRefreshCacheService(
            cacheManager,
            meterRegistry,
            () -> {
              int count = callCount.incrementAndGet();
              if (count == 1) {
                throw new TimeoutException("Simulated upstream timeout");
              }
              return "success-after-timeout";
            });

    // Pre-populate cache with prior successful data and timestamp.
    testCache.put(SimpleKey.EMPTY, "cached-data");
    Instant priorTimestamp = Instant.now().minusSeconds(60);
    testCache.put(GenericRefreshCacheService.LAST_SUCCESSFUL_REFRESH, priorTimestamp);

    // First refresh throws TimeoutException - should be caught and return cached data.
    String firstResult = service.refreshCache().get();
    assertThat(firstResult).isEqualTo("cached-data");

    // lastSuccessfulRefresh should not have been updated by the failed attempt.
    Instant timestampAfterFailure =
        testCache.get(GenericRefreshCacheService.LAST_SUCCESSFUL_REFRESH, Instant.class);
    assertThat(timestampAfterFailure).isEqualTo(priorTimestamp);

    // Second refresh proves the lock was released after the timeout.
    String secondResult = service.refreshCache().get();
    assertThat(secondResult).isEqualTo("success-after-timeout");

    // Verify fetchFromSource was called twice (lock release allowed the retry).
    assertThat(callCount.get()).isEqualTo(2);

    // Cache and timestamp should now reflect the successful retry.
    assertThat(testCache.get(SimpleKey.EMPTY, String.class)).isEqualTo("success-after-timeout");
    Instant newTimestamp =
        testCache.get(GenericRefreshCacheService.LAST_SUCCESSFUL_REFRESH, Instant.class);
    assertThat(newTimestamp).isAfter(priorTimestamp);
  }

  /**
   * Test multiple concurrent requests when cache is empty. The first should fetch, others should
   * wait and get null (no cached data available).
   */
  @Test
  void testConcurrentRefreshWithEmptyCache() throws Exception {
    // Setup: Service that takes time to fetch
    CountDownLatch fetchStarted = new CountDownLatch(1);
    CountDownLatch fetchCanComplete = new CountDownLatch(1);
    AtomicInteger fetchCount = new AtomicInteger(0);

    TestRefreshCacheService service =
        new TestRefreshCacheService(
            cacheManager,
            meterRegistry,
            () -> {
              fetchCount.incrementAndGet();
              fetchStarted.countDown();
              try {
                fetchCanComplete.await();
              } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException(e);
              }
              return "fetched-data";
            });

    // No pre-population - cache is empty

    // Start first refresh on a background thread; it will block in fetchFromSource
    // holding the in-progress flag until we release fetchCanComplete.
    ExecutorService executor = Executors.newSingleThreadExecutor();
    CompletableFuture<String> firstRefresh =
        CompletableFuture.supplyAsync(
            () -> {
              try {
                return service.refreshCache().get();
              } catch (Exception e) {
                throw new RuntimeException(e);
              }
            },
            executor);

    // Wait until first fetch is inside fetchFromSource so the flag is held.
    assertThat(fetchStarted.await(5, TimeUnit.SECONDS)).isTrue();

    // Second and third refreshes run synchronously from the test thread while the
    // first is still blocked - this guarantees they hit the skip path rather than
    // racing with the flag release.
    String secondResult = service.refreshCache().get();
    String thirdResult = service.refreshCache().get();

    // Now allow the first refresh to complete.
    fetchCanComplete.countDown();
    String firstResult = firstRefresh.get(5, TimeUnit.SECONDS);

    // First got the fresh data; second and third were skipped and saw the empty cache.
    assertThat(firstResult).isEqualTo("fetched-data");
    assertThat(secondResult).isNull();
    assertThat(thirdResult).isNull();

    // Only the first refresh actually fetched.
    assertThat(fetchCount.get()).isEqualTo(1);

    // Counter incremented twice (once per skipped refresh).
    assertThat(
            meterRegistry
                .counter(
                    GenericRefreshCacheService.SKIPPED_REFRESH_METRIC, "cache", TEST_CACHE_NAME)
                .count())
        .isEqualTo(2.0);

    executor.shutdown();
    assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
  }

  /**
   * Test that cache is properly updated on successful fetch, including lastSuccessfulRefresh
   * timestamp.
   */
  @Test
  void testSuccessfulFetchUpdatesCache() throws Exception {
    TestRefreshCacheService service =
        new TestRefreshCacheService(cacheManager, meterRegistry, () -> "fresh-data");

    Instant before = Instant.now();
    String result = service.refreshCache().get();
    Instant after = Instant.now();

    // Verify result
    assertThat(result).isEqualTo("fresh-data");

    // Verify cache was updated
    assertThat(testCache.get(SimpleKey.EMPTY, String.class)).isEqualTo("fresh-data");

    // Verify timestamp was recorded
    Instant lastRefresh = testCache.get("lastSuccessfulRefresh", Instant.class);
    assertThat(lastRefresh).isNotNull();
    assertThat(lastRefresh).isBetween(before, after);
  }

  /**
   * Test that when fetch fails, cached data is returned and lastSuccessfulRefresh is not updated.
   */
  @Test
  void testFailedFetchReturnsCachedData() throws Exception {
    TestRefreshCacheService service =
        new TestRefreshCacheService(
            cacheManager,
            meterRegistry,
            () -> {
              throw new RuntimeException("Fetch failed");
            });

    // Pre-populate cache and timestamp
    testCache.put(SimpleKey.EMPTY, "old-data");
    Instant oldTimestamp = Instant.now().minusSeconds(60);
    testCache.put("lastSuccessfulRefresh", oldTimestamp);

    // Attempt refresh
    String result = service.refreshCache().get();

    // Should return cached data
    assertThat(result).isEqualTo("old-data");

    // Timestamp should not be updated
    Instant currentTimestamp = testCache.get("lastSuccessfulRefresh", Instant.class);
    assertThat(currentTimestamp).isEqualTo(oldTimestamp);
  }

  /** Concrete test implementation of GenericRefreshCacheService for testing. */
  private static class TestRefreshCacheService extends GenericRefreshCacheService<String> {

    private final FetchFunction fetchFunction;

    public TestRefreshCacheService(
        CacheManager cacheManager, MeterRegistry meterRegistry, FetchFunction fetchFunction) {
      super(cacheManager, meterRegistry);
      this.fetchFunction = fetchFunction;
    }

    @Override
    public String getCacheName() {
      return TEST_CACHE_NAME;
    }

    @Override
    protected Class<String> valueType() {
      return String.class;
    }

    @Override
    protected String fetchFromSource() throws Exception {
      return fetchFunction.fetch();
    }
  }

  @FunctionalInterface
  private interface FetchFunction {
    String fetch() throws Exception;
  }
}
