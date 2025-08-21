package au.gov.digitalhealth.lingo.service;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.CompletableFuture;
import lombok.extern.java.Log;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.interceptor.SimpleKey;
import org.springframework.scheduling.annotation.Async;

@Log
public abstract class GenericRefreshCacheService<T> {

  private final CacheManager cacheManager;

  protected GenericRefreshCacheService(CacheManager cacheManager) {
    this.cacheManager = cacheManager;
  }

  public abstract String getCacheName();

  protected abstract Class<T> valueType();

  protected abstract T fetchFromSource() throws Exception;

  @Async
  @CachePut(cacheNames = "#{@this.getCacheName()}")
  public CompletableFuture<T> refreshCache() {
    Instant start = Instant.now();
    try {
      T data = fetchFromSource();
      Instant end = Instant.now();

      log.info(
          () ->
              String.format(
                  "[%s] refreshed in %d ms",
                  getCacheName(), Duration.between(start, end).toMillis()));

      // Store the last successful refresh timestamp in the cache for managing multiple caches
      Cache cache = cacheManager.getCache(getCacheName());
      if (cache != null) {
        cache.put("lastSuccessfulRefresh", end);
      }

      return CompletableFuture.completedFuture(data);
    } catch (Exception ex) {
      Cache cache = cacheManager.getCache(getCacheName());
      Instant last =
          (cache != null && cache.get("lastSuccessfulRefresh") != null)
              ? cache.get("lastSuccessfulRefresh", Instant.class)
              : null;
      String lastStr = (last != null) ? last.toString() : "never";
      String timeAgo =
          (last != null) ? formatDuration(Duration.between(last, Instant.now())) : "N/A";

      log.severe(
          () ->
              String.format(
                  "[%s] refresh failed: %s — last successful: %s (%s ago)",
                  getCacheName(), ex.getMessage(), lastStr, timeAgo));

      T cached = (cache != null) ? cache.get(SimpleKey.EMPTY, valueType()) : null;
      return CompletableFuture.completedFuture(cached);
    }
  }

  private String formatDuration(Duration duration) {
    long seconds = duration.getSeconds();
    return String.format("%d seconds", seconds);
  }
}
