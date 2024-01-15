package com.csiro.snomio.service;

import com.csiro.snomio.models.ServiceStatus.Status;
import com.csiro.snomio.models.Task;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class TaskManagerClient {

  private final WebClient authoringPlatformApiClient;

  private final ObjectMapper objectMapper;

  @Value("${ihtsdo.ap.projectKey}")
  String apProject;

  public TaskManagerClient(
      @Qualifier("authoringPlatformApiClient") WebClient authoringPlatformApiClient,
      ObjectMapper objectMapper) {
    this.authoringPlatformApiClient = authoringPlatformApiClient;
    this.objectMapper = objectMapper;
  }

  public JsonArray getUserTasks() throws AccessDeniedException {
    String json =
        authoringPlatformApiClient
            .get()
            .uri("/projects/my-tasks?excludePromoted=false")
            .retrieve()
            .bodyToMono(String.class) // TODO May be change to actual objects?
            .block();
    return new Gson().fromJson(json, JsonArray.class); // //TODO Serialization Bean?
  }

  public JsonArray getAllTasks() throws AccessDeniedException {
    String json =
        authoringPlatformApiClient
            .get()
            .uri("/projects/" + apProject + "/tasks?lightweight=false")
            .retrieve()
            .bodyToMono(String.class) // TODO May be change to actual objects?
            .block();
    return new Gson().fromJson(json, JsonArray.class); // //TODO Serialization Bean?
  }

  public Task getTaskByKey(String branch, String key) throws AccessDeniedException {
    return authoringPlatformApiClient
        .get()
        .uri("/projects/" + branch + "/tasks/" + key)
        .retrieve()
        .bodyToMono(Task.class) // TODO May be change to actual objects?
        .block();
  }

  @Cacheable(cacheNames = "ap-status")
  public Status getStatus() throws AccessDeniedException {
    try {
      return authoringPlatformApiClient
          .get()
          .uri("/version")
          .retrieve()
          .onStatus(HttpStatus.INTERNAL_SERVER_ERROR::equals, clientResponse -> Mono.empty())
          .bodyToMono(String.class)
          .timeout(Duration.ofSeconds(5))
          .map(
              responseBody -> {
                if (responseBody != null && !responseBody.isEmpty()) {
                  JsonNode jsonNode = null;
                  try {
                    jsonNode = objectMapper.readTree(responseBody);
                  } catch (JsonProcessingException ignored) {
                  }
                  String version =
                      jsonNode != null ? jsonNode.path("package_version").asText() : "";

                  return Status.builder().running(true).version(version).build();
                } else {
                  return Status.builder().running(false).version("").build();
                }
              })
          .block();
    } catch (Exception ex) {
      return Status.builder().running(false).version("").build();
    }
  }
}
