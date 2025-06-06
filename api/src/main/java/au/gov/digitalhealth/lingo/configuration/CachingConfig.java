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
package au.gov.digitalhealth.lingo.configuration;

import static au.gov.digitalhealth.lingo.util.CacheConstants.ALL_TASKS_CACHE;
import static au.gov.digitalhealth.lingo.util.CacheConstants.AP_STATUS_CACHE;
import static au.gov.digitalhealth.lingo.util.CacheConstants.COMPOSITE_UNIT_CACHE;
import static au.gov.digitalhealth.lingo.util.CacheConstants.JIRA_USERS_CACHE;
import static au.gov.digitalhealth.lingo.util.CacheConstants.SNOWSTORM_STATUS_CACHE;
import static au.gov.digitalhealth.lingo.util.CacheConstants.UNIT_NUMERATOR_DENOMINATOR_CACHE;
import static au.gov.digitalhealth.lingo.util.CacheConstants.USERS_CACHE;

import au.gov.digitalhealth.lingo.service.JiraUserManagerService;
import au.gov.digitalhealth.lingo.service.SnowstormClient;
import java.util.concurrent.TimeUnit;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableCaching
@EnableScheduling
@Log
public class CachingConfig implements CachingConfigurer {

  SnowstormClient snowstormClient;

  JiraUserManagerService jiraUserManagerService;

  @Value("${ihtsdo.ap.codeSystem}")
  String codeSystem;

  @Value("${caching.spring.jiraUser.enabled}")
  private boolean jiraUserCacheEnabled;

  CachingConfig(SnowstormClient snowstormClient, JiraUserManagerService jiraUserManagerService) {
    this.snowstormClient = snowstormClient;
    this.jiraUserManagerService = jiraUserManagerService;
  }

  @CacheEvict(value = USERS_CACHE, allEntries = true)
  @Scheduled(fixedRateString = "${caching.spring.usersTTL}")
  public void emptyUsersCache() {
    log.finer("emptying user cache");
  }

  @CacheEvict(value = JIRA_USERS_CACHE, allEntries = true)
  @Scheduled(fixedRateString = "${caching.spring.usersTTL}")
  public void emptyJiraUsersCache() {
    if (jiraUserCacheEnabled) {
      log.finer("refreshing jira user cache");
      try {
        jiraUserManagerService.getAllJiraUsers();
      } catch (Exception e) {
        log.warning("Error refreshing jira user cache: " + e.getMessage());
      }
    }
  }

  @CacheEvict(value = SNOWSTORM_STATUS_CACHE, allEntries = true)
  @Scheduled(fixedRateString = "60000")
  public void refreshSnowstormStatusCache() {
    log.finer("Refresh snowstorm status cache");
    try {
      snowstormClient.getStatus(codeSystem);
    } catch (Exception e) {
      log.warning("Error refreshing snowstorm status cache: " + e.getMessage());
    }
  }

  @CacheEvict(value = AP_STATUS_CACHE, allEntries = true)
  @Scheduled(fixedRateString = "60000")
  public void refreshApStatusCache() {
    log.finer("Refreshing ap status cache");
  }

  @CacheEvict(value = ALL_TASKS_CACHE, allEntries = true)
  @Scheduled(fixedRateString = "60000")
  public void refreshAllTasksCache() {
    log.finer("Refresh all Tasks cache");
  }

  @CacheEvict(value = COMPOSITE_UNIT_CACHE)
  @Scheduled(fixedRateString = "60", timeUnit = TimeUnit.MINUTES)
  public void refreshCompositeUnitCache() {
    log.finer("Refresh composite unit cache");
  }

  @CacheEvict(value = UNIT_NUMERATOR_DENOMINATOR_CACHE)
  @Scheduled(fixedRateString = "60", timeUnit = TimeUnit.MINUTES)
  public void refreshUniNumeratorDenominatorCache() {
    log.finer("Refresh unit numerator denominator cache");
  }
}
