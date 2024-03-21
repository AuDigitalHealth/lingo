package com.csiro.snomio.service;

import com.csiro.snomio.configuration.CachingConfig;
import com.csiro.snomio.helper.ClientHelper;
import com.csiro.snomio.models.ServiceStatus.Status;
import com.csiro.snomio.util.CacheConstants;
import com.csiro.snomio.util.Task;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class TaskManagerClient {

  private final WebClient authoringPlatformApiClient;

  private final ObjectMapper objectMapper;

  private final CachingConfig cachingConfig;

  @Value("${ihtsdo.ap.projectKey}")
  String apProject;

  public TaskManagerClient(
      @Qualifier("authoringPlatformApiClient") WebClient authoringPlatformApiClient,
      ObjectMapper objectMapper,
      CachingConfig cachingConfig) {
    this.authoringPlatformApiClient = authoringPlatformApiClient;
    this.objectMapper = objectMapper;
    this.cachingConfig = cachingConfig;
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

  @Cacheable(cacheNames = CacheConstants.ALL_TASKS_CACHE)
  public List<Task> getAllTasks() throws AccessDeniedException {

    Task[] tasks =
        authoringPlatformApiClient
            .get()
            .uri("/projects/" + apProject + "/tasks?lightweight=false")
            .retrieve()
            .bodyToMono(Task[].class)
            .block();
    return Arrays.asList(tasks);
  }

  public Task getTaskByKey(String branch, String key) throws AccessDeniedException {
    return authoringPlatformApiClient
        .get()
        .uri("/projects/" + branch + "/tasks/" + key)
        .retrieve()
        .bodyToMono(Task.class) // TODO May be change to actual objects?
        .block();
  }

  public Task createTask(Task task) throws AccessDeniedException {
    Task createdTask =
        authoringPlatformApiClient
            .post()
            .uri("/projects/" + apProject + "/tasks")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(task)
            .retrieve()
            .bodyToMono(Task.class)
            .block();
    if (createdTask != null) {
      cachingConfig.refreshAllTasksCache(); // evict cache
    }
    return createdTask;
  }

  @Cacheable(cacheNames = CacheConstants.AP_STATUS_CACHE)
  public Status getStatus() throws AccessDeniedException {
    return ClientHelper.getStatus(authoringPlatformApiClient, "package_version");
  }
}
