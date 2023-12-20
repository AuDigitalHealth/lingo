package com.csiro.snomio.service;

import com.csiro.snomio.exception.SnomioProblem;
import com.csiro.snomio.auth.JiraUser;
import com.csiro.snomio.auth.JiraUserResponse;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class JiraUserManagerService {

  private static final List<String> USER_NAME_LIST_AU =
      List.of(
          "sjose",
          "cgillespie",
          "dmcmurtrie",
          "ahon",
          "aedelenyi",
          "hkanchi",
          "kloi",
          "ckellaleamaynard",
          "dathans",
          "jgrimes",
          "mcordell",
          "skong",
          "lang",
          "lswindale"); // hardcoded for now
  private final WebClient authoringPlatformApiClient;

  @Autowired
  public JiraUserManagerService(
      @Qualifier("authoringPlatformApiClient") WebClient authoringPlatformApiClient) {
    this.authoringPlatformApiClient = authoringPlatformApiClient;
  }

  @Cacheable(cacheNames = "jiraUsers")
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
              .filter(
                  jiraUser -> jiraUser.isActive() && USER_NAME_LIST_AU.contains(jiraUser.getName()))
              .toList());

      offset += 50;
      size = response.getUsers().getSize();
    }
    return jiraUserList.stream().distinct().toList(); // remove any duplicates
  }

  private JiraUserResponse invokeApi(int offset) {
    return authoringPlatformApiClient
        .get()
        .uri("/users?offset=" + offset)
        .retrieve()
        .bodyToMono(JiraUserResponse.class) // TODO May be change to actual objects?
        .block();
  }
}
