package au.gov.digitalhealth.lingo.service;

import au.gov.digitalhealth.lingo.util.CacheConstants;
import au.gov.digitalhealth.lingo.util.Task;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class AllTasksService extends GenericRefreshCacheService<List<Task>> {

  private final WebClient defaultAuthoringPlatformApiClient;

  @Value("${ihtsdo.ap.projectKey}")
  private String apProject;

  public AllTasksService(
      @Qualifier("defaultAuthoringPlatformApiClient") WebClient defaultAuthoringPlatformApiClient,
      CacheManager cacheManager) {
    super(cacheManager);
    this.defaultAuthoringPlatformApiClient = defaultAuthoringPlatformApiClient;
  }

  @Override
  public String getCacheName() {
    return CacheConstants.ALL_TASKS_CACHE;
  }

  @Override
  @SuppressWarnings("unchecked")
  protected Class<List<Task>> valueType() {
    return (Class<List<Task>>) (Class<?>) List.class;
  }

  @Override
  protected List<Task> fetchFromSource() throws AccessDeniedException {
    Task[] tasks =
        defaultAuthoringPlatformApiClient
            .get()
            .uri("/projects/" + apProject + "/tasks?lightweight=false")
            .retrieve()
            .bodyToMono(Task[].class)
            .block();
    return Arrays.asList(tasks);
  }
}
