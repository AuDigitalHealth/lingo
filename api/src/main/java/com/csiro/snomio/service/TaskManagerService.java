package com.csiro.snomio.service;

import com.csiro.snomio.security.auth.AuthHelper;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class TaskManagerService {
  private final WebClient webClient;
  private final String imsCookieName;
  private final AuthHelper authHelper;

  @Autowired
  public TaskManagerService(
      @Qualifier("apiWebClient") WebClient webClient,
      @Value("${ims.api.cookie.name}") String imsCookieName,
      AuthHelper authHelper) {
    this.imsCookieName = imsCookieName;
    this.webClient = webClient;
    this.authHelper = authHelper;
  }

  public JsonArray getUserTasks() throws AccessDeniedException {
    String json =
        webClient
            .get()
            .uri("/projects/my-tasks?excludePromoted=false")
            .cookie(imsCookieName, authHelper.getCookie())
            .retrieve()
            .bodyToMono(String.class)
            .block();
    JsonArray convertedObject = new Gson().fromJson(json, JsonArray.class);
    return convertedObject;
  }
}
