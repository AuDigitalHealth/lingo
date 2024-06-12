package com.csiro.snomio.configuration;

import com.csiro.snomio.service.JiraUserManagerService;
import com.csiro.snomio.service.SnowstormClient;
import com.csiro.snomio.util.CacheConstants;
import java.util.concurrent.TimeUnit;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

  SnowstormClient snowstormClient;

  JiraUserManagerService jiraUserManagerService;

  @Value("${caching.spring.jiraUser.enabled}")
  private boolean jiraUserCacheEnabled;

  @Autowired
  CachingConfig(SnowstormClient snowstormClient, JiraUserManagerService jiraUserManagerService) {
    this.snowstormClient = snowstormClient;
    this.jiraUserManagerService = jiraUserManagerService;
  }

  @CacheEvict(value = CacheConstants.USERS_CACHE, allEntries = true)
  @Scheduled(fixedRateString = "${caching.spring.usersTTL}")
  public void emptyUsersCache() {
    log.info("emptying user cache");
  }

  @CacheEvict(value = CacheConstants.JIRA_USERS_CACHE, allEntries = true)
  @Scheduled(fixedRateString = "${caching.spring.usersTTL}")
  public void emptyJiraUsersCache() {
    if (jiraUserCacheEnabled) {
      jiraUserManagerService.getAllJiraUsers();
      log.info("refreshing jira user cache");
    }
  }

  @CacheEvict(value = CacheConstants.SNOWSTORM_STATUS_CACHE, allEntries = true)
  @Scheduled(fixedRateString = "60000")
  public void refreshSnowstormStatusCache() {
    log.info("Refresh snowstorm status cache");
    snowstormClient.getStatus();
  }

  @CacheEvict(value = CacheConstants.AP_STATUS_CACHE, allEntries = true)
  @Scheduled(fixedRateString = "60000")
  public void refreshApStatusCache() {
    log.info("Refreshing ap status cache");
  }

  @CacheEvict(value = CacheConstants.ALL_TASKS_CACHE, allEntries = true)
  @Scheduled(fixedRateString = "60000")
  public void refreshAllTasksCache() {
    log.info("Refresh all Tasks cache");
  }

  @CacheEvict(value = CacheConstants.COMPOSITE_UNIT_CACHE)
  @Scheduled(fixedRateString = "60", timeUnit = TimeUnit.MINUTES)
  public void refreshCompositeUnitCache() {
    log.info("Refresh composite unit cache");
  }
}
