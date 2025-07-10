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

import au.gov.digitalhealth.lingo.configuration.CachingConfig;
import au.gov.digitalhealth.lingo.service.ServiceStatus.Status;
import au.gov.digitalhealth.lingo.util.CacheConstants;
import au.gov.digitalhealth.lingo.util.ClientHelper;
import au.gov.digitalhealth.lingo.util.Task;
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

  private final WebClient defaultAuthoringPlatformApiClient;

  private final CachingConfig cachingConfig;

  @Value("${ihtsdo.ap.projectKey}")
  String apProject;

  public TaskManagerClient(
      @Qualifier("authoringPlatformApiClient") WebClient authoringPlatformApiClient,
      @Qualifier("defaultAuthoringPlatformApiClient") WebClient defaultAuthoringPlatformApiClient,
      CachingConfig cachingConfig) {
    this.authoringPlatformApiClient = authoringPlatformApiClient;
    this.defaultAuthoringPlatformApiClient = defaultAuthoringPlatformApiClient;
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

  @SuppressWarnings("java:S1192")
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

  public List<Task> getAllTasksOverProject() throws AccessDeniedException {

    Task[] tasks =
        defaultAuthoringPlatformApiClient
            .get()
            .uri("/projects/tasks/search?criteria=" + apProject)
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

  public List<Task> getTaskByKeyOverProjects(String key) throws AccessDeniedException {
    // should actually only ever be 1
    Task[] tasks =
        defaultAuthoringPlatformApiClient
            .get()
            .uri("/projects/tasks/search?criteria=" + key + "&lightweight=false")
            .retrieve()
            .bodyToMono(Task[].class)
            .block();
    return Arrays.asList(tasks);
  }

  public Task createTask(Task task) throws AccessDeniedException {
    Task createdTask =
        authoringPlatformApiClient
            .post()
            .uri("/projects/" + task.getProjectKey() + "/tasks")
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
