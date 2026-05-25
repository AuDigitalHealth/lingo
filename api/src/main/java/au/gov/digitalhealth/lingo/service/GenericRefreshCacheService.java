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

import io.micrometer.core.instrument.MeterRegistry;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import lombok.extern.java.Log;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.interceptor.SimpleKey;
import org.springframework.scheduling.annotation.Async;

@Log
public abstract class GenericRefreshCacheService<T> {

  public static final String LAST_SUCCESSFUL_REFRESH = "lastSuccessfulRefresh";
  static final String SKIPPED_REFRESH_METRIC = "snomio.cache.refresh.skipped";
  private final CacheManager cacheManager;
  private final MeterRegistry meterRegistry;
  private static final Map<String, AtomicBoolean> refreshInProgressMap = new ConcurrentHashMap<>();

  protected GenericRefreshCacheService(CacheManager cacheManager, MeterRegistry meterRegistry) {
    this.cacheManager = cacheManager;
    this.meterRegistry = meterRegistry;
  }

  public abstract String getCacheName();

  protected abstract Class<T> valueType();

  protected abstract T fetchFromSource() throws Exception;

  @Async
  public CompletableFuture<T> refreshCache() {
    String cacheName = getCacheName();
    AtomicBoolean refreshInProgress =
        refreshInProgressMap.computeIfAbsent(cacheName, k -> new AtomicBoolean(false));

    // Skip if already running
    if (!refreshInProgress.compareAndSet(false, true)) {
      log.warning(() -> String.format("[%s] refresh already in progress, skipping", cacheName));
      meterRegistry.counter(SKIPPED_REFRESH_METRIC, "cache", cacheName).increment();
      Cache cache = cacheManager.getCache(cacheName);
      T cached = (cache != null) ? cache.get(SimpleKey.EMPTY, valueType()) : null;
      return CompletableFuture.completedFuture(cached);
    }

    try {
      Instant start = Instant.now();
      Cache cache = cacheManager.getCache(getCacheName());

      T data = fetchFromSource();
      Instant end = Instant.now();

      log.info(
          () ->
              String.format(
                  "[%s] refreshed in %d ms",
                  getCacheName(), Duration.between(start, end).toMillis()));

      if (cache != null) {
        cache.put(SimpleKey.EMPTY, data);
        cache.put(LAST_SUCCESSFUL_REFRESH, end);
      }

      return CompletableFuture.completedFuture(data);

    } catch (Exception ex) {
      Instant last = null;
      Cache cache = cacheManager.getCache(getCacheName());
      if (cache != null && cache.get(LAST_SUCCESSFUL_REFRESH) != null) {
        last = cache.get(LAST_SUCCESSFUL_REFRESH, Instant.class);
      }

      String lastStr = (last != null) ? last.toString() : "never";
      String timeAgo =
          (last != null)
              ? String.format("%d seconds", Duration.between(last, Instant.now()).getSeconds())
              : "N/A";

      log.severe(
          () ->
              String.format(
                  "[%s] refresh failed: %s — last successful: %s (%s ago)",
                  getCacheName(), ex.getMessage(), lastStr, timeAgo));

      T cached = (cache != null) ? cache.get(SimpleKey.EMPTY, valueType()) : null;
      return CompletableFuture.completedFuture(cached);
    } finally {
      refreshInProgress.set(false);
    }
  }
}
