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

import au.gov.digitalhealth.lingo.auth.JiraUser;
import au.gov.digitalhealth.lingo.auth.JiraUserResponse;
import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.util.CacheConstants;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@EnableScheduling
@Log
public class JiraUserManagerService extends GenericRefreshCacheService<List<JiraUser>> {
  @Value("${snomio.jira.users:}")
  private Set<String> users;

  @Value("${lingo.internal.users:}")
  private Set<String> internalUsers;

  private final WebClient defaultAuthoringPlatformApiClient;

  @Autowired
  public JiraUserManagerService(
      @Qualifier("defaultAuthoringPlatformApiClient") WebClient defaultAuthoringPlatformApiClient,
      CacheManager cacheManager) {
    super(cacheManager);
    this.defaultAuthoringPlatformApiClient = defaultAuthoringPlatformApiClient;
  }

  @Override
  public String getCacheName() {
    return CacheConstants.JIRA_USERS_CACHE;
  }

  @Override
  @SuppressWarnings("unchecked")
  protected Class<List<JiraUser>> valueType() {
    return (Class<List<JiraUser>>) (Class<?>) List.class;
  }

  public Set<String> getAllInternalUsers() throws AccessDeniedException {
    return this.internalUsers;
  }

  @Cacheable(cacheNames = CacheConstants.JIRA_USERS_CACHE)
  public List<JiraUser> getAllJiraUsers() throws AccessDeniedException {
    return fetchFromSource();
  }

  @Override
  protected List<JiraUser> fetchFromSource() throws AccessDeniedException {
    List<JiraUser> jiraUserList = new ArrayList<>();
    int offset = 0;
    int size = 0;
    while (offset <= size) {
      JiraUserResponse response = invokeApi(offset);
      if (response == null) {
        throw new LingoProblem(
            "bad-jira-user-response", "Error getting Jira users", HttpStatus.BAD_GATEWAY);
      }

      if (response.getUsers() != null && response.getUsers().getItems() != null) {
        jiraUserList.addAll(
            response.getUsers().getItems().stream()
                .filter(jiraUser -> jiraUser.isActive() && users.contains(jiraUser.getName()))
                .toList());

        size = response.getUsers().getSize();
        offset += 50;
      } else {
        log.severe("Error with jira user response, getUsers.getItems is null.");
        break;
      }
    }
    return jiraUserList.stream().distinct().toList(); // remove any duplicates
  }

  private JiraUserResponse invokeApi(int offset) {
    return defaultAuthoringPlatformApiClient
        .get()
        .uri("/users?offset=" + offset)
        .retrieve()
        .bodyToMono(JiraUserResponse.class) // TODO May be change to actual objects?
        .block();
  }
}
