package com.csiro.snomio.configuration;

import com.csiro.snomio.service.JiraUserManagerService;
import com.csiro.snomio.service.SnowstormClient;
import com.csiro.snomio.service.TaskManagerClient;
import com.csiro.snomio.util.CacheConstants;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
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

  TaskManagerClient taskManagerClient;
  SnowstormClient snowstormClient;

  JiraUserManagerService jiraUserManagerService;

  @Autowired
  CachingConfig(
      SnowstormClient snowstormClient,
      TaskManagerClient taskManagerClient,
      JiraUserManagerService jiraUserManagerService) {
    this.snowstormClient = snowstormClient;
    this.taskManagerClient = taskManagerClient;
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
    jiraUserManagerService.getAllJiraUsers();
    log.info("refreshing jira user cache");
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
    taskManagerClient.getStatus();
  }
}
