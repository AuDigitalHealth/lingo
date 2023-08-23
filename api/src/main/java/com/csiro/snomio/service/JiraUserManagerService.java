package com.csiro.snomio.service;

import com.csiro.snomio.models.JiraUser;
import com.csiro.snomio.models.JiraUserResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class JiraUserManagerService {
  private final WebClient snowStormApiClient;

  @Autowired
  public JiraUserManagerService(@Qualifier("snowStormApiClient") WebClient snowStormApiClient) {
    this.snowStormApiClient = snowStormApiClient;
  }

  private static List<String> USER_NAME_LIST_AU =
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

  @Cacheable(cacheNames = "jiraUsers")
  public List<JiraUser> getAllJiraUsers() throws AccessDeniedException {
    List<JiraUser> jiraUserList = new ArrayList<>();
    int offset = 0;
    int size = 0;
    while (offset <= size) {
      JiraUserResponse response = invokeApi(offset);
      jiraUserList.addAll(
          response.getUsers().getItems().stream()
              .filter(
                  jiraUser -> jiraUser.isActive() && USER_NAME_LIST_AU.contains(jiraUser.getName()))
              .collect(Collectors.toList()));

      offset += 50;
      size = response.getUsers().getSize();
    }
    return jiraUserList.stream().distinct().collect(Collectors.toList()); // remove any duplicates
  }

  private JiraUserResponse invokeApi(int offset) {
    return snowStormApiClient
        .get()
        .uri("/users?offset=" + offset)
        .retrieve()
        .bodyToMono(JiraUserResponse.class) // TODO May be change to actual objects?
        .block();
  }
}
