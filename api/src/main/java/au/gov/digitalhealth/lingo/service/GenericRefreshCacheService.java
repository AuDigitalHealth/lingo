package au.gov.digitalhealth.lingo.service;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.CompletableFuture;
import lombok.extern.java.Log;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
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
  public CompletableFuture<T> refreshCache() {
    Instant start = Instant.now();
    Cache cache = cacheManager.getCache(getCacheName());

    try {
      T data = fetchFromSource();
      Instant end = Instant.now();

      log.info(
          () ->
              String.format(
                  "[%s] refreshed in %d ms",
                  getCacheName(), Duration.between(start, end).toMillis()));

      if (cache != null) {
        cache.put(SimpleKey.EMPTY, data);
        cache.put("lastSuccessfulRefresh", end);
      }

      return CompletableFuture.completedFuture(data);

    } catch (Exception ex) {
      Instant last = null;
      if (cache != null && cache.get("lastSuccessfulRefresh") != null) {
        last = cache.get("lastSuccessfulRefresh", Instant.class);
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
    }
  }
}
