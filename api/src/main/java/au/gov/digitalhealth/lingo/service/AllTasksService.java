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

import au.gov.digitalhealth.lingo.util.CacheConstants;
import au.gov.digitalhealth.lingo.util.Task;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class AllTasksService extends GenericRefreshCacheService<List<Task>> {

  private final WebClient defaultAuthoringPlatformApiClient;

  @Value("${ihtsdo.ap.projectKey}")
  private Set<String> apProjects;

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
    Mono<List<Task>> allTasksMono =
        Flux.fromIterable(apProjects)
            .flatMap(
                projectKey ->
                    defaultAuthoringPlatformApiClient
                        .get()
                        .uri("/projects/" + projectKey + "/tasks?lightweight=false")
                        .retrieve()
                        .bodyToMono(Task[].class)
                        .flatMapMany(tasks -> tasks == null ? Flux.empty() : Flux.fromArray(tasks)))
            .collectList();

    return allTasksMono.block();
  }
}
