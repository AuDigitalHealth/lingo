package com.csiro.snomio.service;

import com.csiro.snomio.auth.JiraUser;
import com.csiro.snomio.auth.JiraUserResponse;
import com.csiro.snomio.exception.SnomioProblem;
import com.csiro.snomio.util.CacheConstants;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@EnableScheduling
public class JiraUserManagerService {
  @Value("${snomio.jira.users:}")
  private Set<String> users;

  private final WebClient defaultAuthoringPlatformApiClient;

  @Autowired
  public JiraUserManagerService(
      @Qualifier("defaultAuthoringPlatformApiClient") WebClient defaultAuthoringPlatformApiClient) {
    this.defaultAuthoringPlatformApiClient = defaultAuthoringPlatformApiClient;
  }

  @Cacheable(cacheNames = CacheConstants.JIRA_USERS_CACHE)
  public List<JiraUser> getAllJiraUsers() throws AccessDeniedException {
    List<JiraUser> jiraUserList = new ArrayList<>();
    int offset = 0;
    int size = 0;
    while (offset <= size) {
      JiraUserResponse response = invokeApi(offset);
      if (response == null) {
        throw new SnomioProblem(
            "bad-jira-user-response", "Error getting Jira users", HttpStatus.BAD_GATEWAY);
      }
      jiraUserList.addAll(
          response.getUsers().getItems().stream()
              .filter(jiraUser -> jiraUser.isActive() && users.contains(jiraUser.getName()))
              .toList());

      offset += 50;
      size = response.getUsers().getSize();
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
