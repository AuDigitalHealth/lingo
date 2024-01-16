package com.csiro.snomio.configuration;

import com.csiro.snomio.util.CacheConstants;
import lombok.extern.java.Log;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableCaching
@EnableScheduling
@Log
public class CachingConfig {

  @CacheEvict(value = CacheConstants.USERS_CACHE, allEntries = true)
  @Scheduled(fixedRateString = "${caching.spring.usersTTL}")
  public void emptyUsersCache() {
    log.info("emptying user cache");
  }

  @CacheEvict(value = CacheConstants.SNOWSTORM_STATUS_CACHE, allEntries = true)
  @Scheduled(fixedRateString = "60000")
  public void emptySnowstormStatusCache() {
    log.info("Emptying snowstorm status cache");
  }

  @CacheEvict(value = CacheConstants.AP_STATUS_CACHE, allEntries = true)
  @Scheduled(fixedRateString = "60000")
  public void emptyApStatusCache() {
    log.info("Emptying ap status cache");
  }
}
