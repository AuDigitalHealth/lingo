package au.gov.digitalhealth.lingo.service;

import au.gov.digitalhealth.lingo.util.CacheConstants;
import au.gov.digitalhealth.lingo.util.Task;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.interceptor.SimpleKey;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@Log
public class AllTasksService {

  private final WebClient defaultAuthoringPlatformApiClient;

  @Value("${ihtsdo.ap.projectKey}")
  private String apProject;

  @Autowired private CacheManager cacheManager;

  public AllTasksService(
      @Qualifier("defaultAuthoringPlatformApiClient") WebClient defaultAuthoringPlatformApiClient) {
    this.defaultAuthoringPlatformApiClient = defaultAuthoringPlatformApiClient;
  }

  /** Refresh the tasks cache asynchronously. */
  @Async
  @CachePut(cacheNames = CacheConstants.ALL_TASKS_CACHE)
  public CompletableFuture<List<Task>> refreshAllTasksCache() throws AccessDeniedException {
    Instant start = Instant.now();
    List<Task> tasks = null;

    try {
      tasks = fetchTasksFromRemote();
    } catch (Exception ex) {
      // Log timeout or other exceptions
      log.severe(() -> "Failed to fetch tasks from remote, keeping old cache: " + ex.getMessage());
      // Returning old cache
      return CompletableFuture.completedFuture(getCachedTasks());
    }

    Instant end = Instant.now();
    Duration duration = Duration.between(start, end);
    log.info(() -> String.format("All Tasks cache refreshed in %d ms", duration.toMillis()));

    return CompletableFuture.completedFuture(tasks);
  }

  /** Fetch tasks from remote authoring platform. */
  public List<Task> fetchTasksFromRemote() throws AccessDeniedException {
    Task[] tasks =
        defaultAuthoringPlatformApiClient
            .get()
            .uri("/projects/" + apProject + "/tasks?lightweight=false")
            .retrieve()
            .bodyToMono(Task[].class)
            .block();

    return Arrays.asList(tasks);
  }

  private List<Task> getCachedTasks() {
    List<Task> cached =
        cacheManager.getCache(CacheConstants.ALL_TASKS_CACHE).get(SimpleKey.EMPTY, List.class);
    return cached != null ? cached : List.of(); // return empty list if cache empty
  }
}
