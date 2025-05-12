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

import au.csiro.snowstorm_client.api.ConceptsApi;
import au.csiro.snowstorm_client.api.RefsetMembersApi;
import au.csiro.snowstorm_client.api.RelationshipsApi;
import au.csiro.snowstorm_client.invoker.ApiClient;
import au.csiro.snowstorm_client.model.*;
import au.csiro.snowstorm_client.model.SnowstormAsyncConceptChangeBatch.StatusEnum;
import au.gov.digitalhealth.lingo.configuration.model.MappingRefset;
import au.gov.digitalhealth.lingo.exception.BatchSnowstormRequestFailedProblem;
import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.exception.SingleConceptExpectedProblem;
import au.gov.digitalhealth.lingo.log.SnowstormLogger;
import au.gov.digitalhealth.lingo.service.ServiceStatus.SnowstormStatus;
import au.gov.digitalhealth.lingo.service.ServiceStatus.Status;
import au.gov.digitalhealth.lingo.util.AmtConstants;
import au.gov.digitalhealth.lingo.util.BranchPatternMatcher;
import au.gov.digitalhealth.lingo.util.CacheConstants;
import au.gov.digitalhealth.lingo.util.ClientHelper;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.stream.Collectors;
import javax.annotation.PreDestroy;
import lombok.Getter;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.util.Pair;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Client for Snowstorm's REST API */
@Getter
@Service
@Log
public class SnowstormClient {
  private static final ThreadLocal<ApiClient> apiClient = new ThreadLocal<>();
  private static final ThreadLocal<ConceptsApi> conceptsApi = new ThreadLocal<>();
  private final ThreadLocal<RefsetMembersApi> refsetMembersApi = new ThreadLocal<>();
  private final String snowstormUrl;
  private final WebClient snowStormApiClient;
  private final ObjectMapper objectMapper;
  private final SnowstormLogger logger;

  @Value("${snomio.snowstorm.batch.checks.delay:500}")
  private int delayBetweenBatchChecks;

  @Value("${snomio.snowstorm.max.batch.checks:100}")
  private int maxBatchChecks;

  @Value("${ihtsdo.ap.languageHeader}")
  private String languageHeader;

  @Autowired
  public SnowstormClient(
      @Qualifier("snowStormApiClient") WebClient snowStormApiClient,
      @Value("${ihtsdo.snowstorm.api.url}") String snowstormUrl,
      ObjectMapper objectMapper,
      SnowstormLogger snowstormLogger) {
    this.snowStormApiClient = snowStormApiClient;
    this.snowstormUrl = snowstormUrl;
    this.objectMapper = objectMapper;
    this.logger = snowstormLogger;
  }

  private static String populateParameters(String ecl, Pair<String, Object>[] params) {
    if (params != null) {
      for (Pair<String, Object> param : params) {
        ecl = ecl.replaceAll(param.getFirst(), param.getSecond().toString());
      }
    }

    return ecl;
  }

  // This is mostly to quiet down Sonar
  @PreDestroy
  public void close() {
    if (apiClient.get() != null) {
      apiClient.remove();
    }
    if (conceptsApi.get() != null) {
      conceptsApi.remove();
    }
    if (refsetMembersApi.get() != null) {
      refsetMembersApi.remove();
    }
  }

  public SnowstormConceptMini getConcept(String branch, String id) {
    ConceptsApi api = getConceptsApi();

    return api.findConcept(branch, id, languageHeader).block();
  }

  public final SnowstormConceptMini getConceptFromEcl(String branch, String ecl, Long id)
      throws SingleConceptExpectedProblem {
    return getConceptFromEcl(branch, ecl, Pair.of("<id>", id));
  }

  @SafeVarargs
  public final SnowstormConceptMini getConceptFromEcl(
      String branch, String ecl, Pair<String, Object>... params)
      throws SingleConceptExpectedProblem {
    ecl = populateParameters(ecl, params);
    Collection<SnowstormConceptMini> concepts = getConceptsFromEcl(branch, ecl, 0, 2);
    if (concepts.size() != 1) {
      concepts = getConceptsFromInferredEcl(branch, ecl, 0, 2);
      if (concepts.size() != 1) {
        throw new SingleConceptExpectedProblem(branch, ecl, concepts);
      }
    }
    return concepts.iterator().next();
  }

  public Collection<SnowstormConceptMini> getConceptsFromEcl(String branch, String ecl, int limit) {
    return getConceptsFromEcl(branch, ecl, 0, limit);
  }

  public Collection<SnowstormConceptMini> getConceptsFromEcl(
      String branch, String ecl, Long id, int offset, int limit) {
    return getConceptsFromEcl(branch, ecl, offset, limit, Pair.of("<id>", id));
  }

  public Collection<SnowstormConceptMini> getConceptsFromInferredEcl(
      String branch, String ecl, Long id, int offset, int limit) {
    return getConceptsFromInferredEcl(branch, ecl, offset, limit, Pair.of("<id>", id));
  }

  public Collection<String> getConceptsIdsFromEcl(
      String branch, String ecl, long id, int offset, int limit) {
    return getConceptIdsFromEcl(branch, ecl, offset, limit, Pair.of("<id>", id));
  }

  @SafeVarargs
  @SuppressWarnings("java:S1192")
  public final Collection<String> getConceptIdsFromEcl(
      String branch, String ecl, int offset, int limit, Pair<String, Object>... params) {
    ecl = populateParameters(ecl, params);

    ConceptsApi api = getConceptsApi();

    Instant start = Instant.now();

    SnowstormItemsPageObject page =
        api.search(
                branch,
                new SnowstormConceptSearchRequest()
                    .statedEclFilter(ecl)
                    .returnIdOnly(true)
                    .offset(offset)
                    .limit(limit)
                    .conceptIds(null)
                    .module(null)
                    .preferredOrAcceptableIn(null)
                    .acceptableIn(null)
                    .preferredIn(null)
                    .language(null)
                    .descriptionType(null),
                "en") // acceptability doesn't matter since this just returns ids
            .block();

    Instant end = Instant.now();

    if (log.isLoggable(Level.FINE)) {
      logger.logFine(
          " executed id only ECL: "
              + ecl
              + ", offset: "
              + offset
              + ", limit: "
              + limit
              + " in "
              + Duration.between(start, end).toMillis()
              + " ms");
    }

    validatePage(branch, ecl, page);
    return Objects.requireNonNull(page.getItems()).stream().map(o -> (String) o).toList();
  }

  @SuppressWarnings("java:S1192")
  private void validatePage(String branch, String ecl, SnowstormItemsPageObject page) {
    if (page == null) {
      throw new LingoProblem(
          "no-page",
          "No page from Snowstorm for ECL",
          HttpStatus.INTERNAL_SERVER_ERROR,
          "No page from Snowstorm for ECL '" + ecl + "' on branch '" + branch + "'");
    } else if (page.getTotal() == null || page.getLimit() == null) {
      throw new LingoProblem(
          "no-total",
          "No total from Snowstorm for ECL",
          HttpStatus.INTERNAL_SERVER_ERROR,
          "No total from Snowstorm for ECL '" + ecl + "' on branch '" + branch + "'");
    } else if (page.getTotal() > page.getLimit()) {
      throw new LingoProblem(
          "too-many-concepts",
          "Too many concepts",
          HttpStatus.INTERNAL_SERVER_ERROR,
          "Too many concepts found for ecl '"
              + ecl
              + "' on branch '"
              + branch
              + "' limit "
              + page.getLimit()
              + " total "
              + page.getTotal());
    }
  }

  public Collection<SnowstormConceptMini> getConceptsFromEcl(
      String branch, String ecl, int offset, int limit, Pair<String, Object>... params) {
    ecl = populateParameters(ecl, params);

    ConceptsApi api = getConceptsApi();

    Instant start = Instant.now();

    SnowstormItemsPageObject page =
        api.search(
                branch,
                new SnowstormConceptSearchRequest()
                    .statedEclFilter(ecl)
                    .returnIdOnly(false)
                    .offset(offset)
                    .limit(limit)
                    .conceptIds(null)
                    .module(null)
                    .preferredOrAcceptableIn(null)
                    .acceptableIn(null)
                    .preferredIn(null)
                    .language(null)
                    .descriptionType(null),
                languageHeader)
            .block();

    Instant end = Instant.now();

    if (log.isLoggable(Level.FINE)) {
      logger.logFine(
          " executed ECL: "
              + ecl
              + ", offset: "
              + offset
              + ", limit: "
              + limit
              + " in "
              + Duration.between(start, end).toMillis()
              + " ms");
    }

    validatePage(branch, ecl, page);
    return Objects.requireNonNull(
            page.getItems(), "response page unexpectedly empty for ECL " + ecl)
        .stream()
        .map(SnowstormDtoUtil::fromLinkedHashMap)
        .filter(c -> c.getActive() != null && c.getActive())
        .toList();
  }

  public Collection<SnowstormConceptMini> getConceptsFromInferredEcl(
      String branch, String ecl, int offset, int limit, Pair<String, Object>... params) {
    ecl = populateParameters(ecl, params);

    ConceptsApi api = getConceptsApi();

    Instant start = Instant.now();

    SnowstormItemsPageObject page =
        api.search(
                branch,
                new SnowstormConceptSearchRequest()
                    .eclFilter(ecl)
                    .returnIdOnly(false)
                    .offset(offset)
                    .limit(limit)
                    .conceptIds(null)
                    .module(null)
                    .preferredOrAcceptableIn(null)
                    .acceptableIn(null)
                    .preferredIn(null)
                    .language(null)
                    .descriptionType(null),
                languageHeader)
            .block();

    Instant end = Instant.now();

    if (log.isLoggable(Level.FINE)) {
      logger.logFine(
          " executed ECL: "
              + ecl
              + ", offset: "
              + offset
              + ", limit: "
              + limit
              + " in "
              + Duration.between(start, end).toMillis()
              + " ms");
    }

    validatePage(branch, ecl, page);
    return Objects.requireNonNull(
            page.getItems(), "response page unexpectedly empty for ECL " + ecl)
        .stream()
        .map(SnowstormDtoUtil::fromLinkedHashMap)
        .filter(c -> c.getActive() != null && c.getActive())
        .toList();
  }

  public Collection<SnowstormConceptMini> getConceptsFromEclAllPages(
      String branch, String ecl, int pageSize, Pair<String, Object>... params) {
    final String populatedEcl = populateParameters(ecl, params);
    ConceptsApi api = getConceptsApi();
    ExecutorService executor = Executors.newFixedThreadPool(10);

    try {
      // First, get the total count
      SnowstormItemsPageObject firstPage = fetchPage(api, branch, populatedEcl, 0, 1);
      Long totalItems = firstPage.getTotal();

      if (totalItems == null || totalItems == 0) {
        return Collections.emptyList();
      }

      // Calculate the number of pages
      int totalPages = (int) Math.ceil((double) totalItems / pageSize);

      // Create a list to hold all the futures
      List<CompletableFuture<List<SnowstormConceptMini>>> futures = new ArrayList<>();

      // Submit a task for each page
      for (int i = 0; i < totalPages; i++) {
        int offset = i * pageSize;
        CompletableFuture<List<SnowstormConceptMini>> future =
            CompletableFuture.supplyAsync(
                () -> {
                  SnowstormItemsPageObject page =
                      fetchPage(api, branch, populatedEcl, offset, pageSize);
                  return Objects.requireNonNull(page.getItems()).stream()
                      .map(SnowstormDtoUtil::fromLinkedHashMap)
                      .filter(c -> c.getActive() != null && c.getActive())
                      .toList();
                },
                executor);
        futures.add(future);
      }

      // Wait for all futures to complete and collect results
      CompletableFuture<Void> allOf =
          CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]));
      return allOf
          .thenApply(v -> futures.stream().flatMap(future -> future.join().stream()).toList())
          .join();
    } finally {
      executor.shutdown();
    }
  }

  private SnowstormItemsPageObject fetchPage(
      ConceptsApi api, String branch, String ecl, int offset, int limit) {
    Instant start = Instant.now();
    SnowstormItemsPageObject page =
        api.search(
                branch,
                new SnowstormConceptSearchRequest()
                    .statedEclFilter(ecl)
                    .returnIdOnly(false)
                    .offset(offset)
                    .limit(limit)
                    .conceptIds(null)
                    .module(null)
                    .preferredOrAcceptableIn(null)
                    .acceptableIn(null)
                    .preferredIn(null)
                    .language(null)
                    .descriptionType(null),
                languageHeader)
            .block();
    Instant end = Instant.now();

    if (log.isLoggable(Level.FINE)) {
      logger.logFine(
          " executed ECL: "
              + ecl
              + ", offset: "
              + offset
              + ", limit: "
              + limit
              + " in "
              + Duration.between(start, end).toMillis()
              + " ms");
    }
    return page;
  }

  public List<SnowstormReferenceSetMember> getMappingRefsetMembers(
      String branch, Collection<String> concepts, Set<MappingRefset> mappingRefsets) {
    return getRefsetMembers(
            branch,
            concepts,
            mappingRefsets.stream().map(MappingRefset::getIdentifier).collect(Collectors.toSet()),
            0,
            100)
        .mapNotNull(SnowstormItemsPageReferenceSetMember::getItems)
        .flatMapIterable(items -> items)
        .collectList()
        .block();
  }

  public Mono<SnowstormItemsPageReferenceSetMember> getRefsetMembers(
      String branch,
      Collection<String> concepts,
      Set<String> referenceSetId,
      int offset,
      int limit) {
    SnowstormMemberSearchRequestComponent searchRequestComponent =
        new SnowstormMemberSearchRequestComponent();
    searchRequestComponent.active(true);
    if (concepts != null) {
      searchRequestComponent.referencedComponentIds(List.copyOf(concepts));
    }
    if (referenceSetId != null) {
      searchRequestComponent.referenceSet(
          referenceSetId.stream().collect(Collectors.joining(" OR ")));
    }
    return getRefsetMembersApi()
        .findRefsetMembers(
            branch, searchRequestComponent, offset, Math.min(limit, 10000), languageHeader);
  }

  public Collection<SnowstormReferenceSetMember> getAllRefsetMembers(
      String branch, Collection<String> concepts, String referenceSetId, String module, int limit) {
    SnowstormMemberSearchRequestComponent searchRequestComponent =
        new SnowstormMemberSearchRequestComponent();
    searchRequestComponent.active(true);
    if (concepts != null) {
      searchRequestComponent.referencedComponentIds(List.copyOf(concepts));
    }
    if (referenceSetId != null) {
      searchRequestComponent.referenceSet(referenceSetId);
    }

    List<SnowstormReferenceSetMember> allMembers = new ArrayList<>();
    String searchAfter = ""; // Start with empty search after

    do {
      // Fetch the current page of refset members
      SnowstormItemsPageReferenceSetMember page =
          getRefsetMembersApi()
              .findRefsetMembers1(
                  branch,
                  referenceSetId,
                  module,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null, // Use searchAfter here
                  0,
                  limit,
                  searchAfter,
                  languageHeader)
              .block();

      if (page == null) {
        throw new LingoProblem(
            "no-page",
            "No page from Snowstorm for refset members",
            HttpStatus.BAD_GATEWAY,
            "No page from Snowstorm for refset members on branch '" + branch + "'");
      }

      // Add current page items to the complete list
      List<SnowstormReferenceSetMember> currentItems = page.getItems();
      if (currentItems == null || currentItems.isEmpty()) {
        // No more items to retrieve
        break;
      }

      allMembers.addAll(currentItems);

      // Update searchAfter for the next iteration
      searchAfter = page.getSearchAfter();

      // Optional: Break if no more search after value (depending on API behavior)
    } while (searchAfter != null && !searchAfter.isEmpty());

    return allMembers;
  }

  public Mono<SnowstormItemsPageReferenceSetMember> getRefsetMembersByAdditionalFieldSets(
      String branch,
      Map<String, Set<String>> additionalFieldSets,
      String referenceSetId,
      int offset,
      int limit) {

    SnowstormMemberSearchRequestComponent searchRequestComponent =
        new SnowstormMemberSearchRequestComponent();
    searchRequestComponent
        .active(true)
        .referenceSet(referenceSetId)
        .additionalFieldSets(additionalFieldSets);
    return getRefsetMembersApi()
        .findRefsetMembers(
            branch, searchRequestComponent, offset, Math.min(limit, 10000), languageHeader);
  }

  private ApiClient getApiClient() {
    ApiClient client = apiClient.get();
    if (client == null) {
      client = new ApiClient(snowStormApiClient);
      client.setBasePath(snowstormUrl);
      apiClient.set(client);
    }
    return client;
  }

  private ConceptsApi getConceptsApi() {
    ConceptsApi api = conceptsApi.get();

    if (api == null) {
      api = new ConceptsApi(getApiClient());
      conceptsApi.set(api);
    }
    return api;
  }

  private RefsetMembersApi getRefsetMembersApi() {
    RefsetMembersApi api = refsetMembersApi.get();

    if (api == null) {
      api = new RefsetMembersApi(getApiClient());
      refsetMembersApi.set(api);
    }
    return api;
  }

  public Flux<SnowstormConcept> getBrowserConcepts(String branch, Collection<String> concepts) {
    ConceptsApi api = getConceptsApi();
    SnowstormConceptBulkLoadRequestComponent request =
        new SnowstormConceptBulkLoadRequestComponent();
    request.conceptIds(List.copyOf(concepts));
    return api.getBrowserConcepts(branch, request, languageHeader);
  }

  public Mono<SnowstormItemsPageRelationship> getRelationships(String branch, String conceptId) {
    RelationshipsApi api = new RelationshipsApi(getApiClient());

    return api.findRelationships(
        branch, true, null, null, conceptId, null, null, null, null, null, null, languageHeader);
  }

  public SnowstormConceptView createConcept(
      String branch, SnowstormConceptView concept, boolean validate) {
    return getConceptsApi().createConcept(branch, concept, validate, languageHeader).block();
  }

  public SnowstormConceptView updateConcept(
      String branch, String conceptId, SnowstormConceptView concept, boolean validate) {
    return getConceptsApi()
        .updateConcept(branch, conceptId, concept, validate, languageHeader)
        .block();
  }

  @SuppressWarnings("java:S1192")
  public List<SnowstormConceptMini> createConcepts(
      String branch, List<SnowstormConceptView> concepts) throws InterruptedException {

    if (log.isLoggable(Level.FINE)) {
      log.fine("Bulk creating concepts: " + concepts.size() + " on branch: " + branch);
    }
    ResponseEntity<Void> response =
        getConceptsApi()
            .createUpdateConceptBulkChangeWithResponseSpec(branch, concepts)
            .toBodilessEntity()
            .block();
    URI location =
        Objects.requireNonNull(response, "Bulk request must have a non-null response")
            .getHeaders()
            .getLocation();

    if (location == null) {
      throw new BatchSnowstormRequestFailedProblem(
          "Batch failed creating concepts on branch '"
              + branch
              + "' - no location was provided, response was "
              + response);
    }

    log.fine("Batch location: " + location);

    Set<String> ids =
        concepts.stream().map(SnowstormConceptView::getConceptId).collect(Collectors.toSet());
    boolean complete = false;
    int attempts = 0;
    String lastMessage = "";
    while (!complete && attempts++ < maxBatchChecks) {
      log.fine("Checking batch status: " + location);
      SnowstormAsyncConceptChangeBatch batch =
          snowStormApiClient
              .get()
              .uri(location)
              .retrieve()
              .bodyToMono(SnowstormAsyncConceptChangeBatch.class)
              .block();

      if (batch == null) {
        throw new LingoProblem(
            "no-batch",
            "No batch from Snowstorm",
            HttpStatus.BAD_GATEWAY,
            "No batch from Snowstorm for creating concepts on branch '" + branch + "'");
      }

      if (log.isLoggable(Level.FINE)) {
        log.fine("Batch status: " + batch.getStatus());
        log.fine("Batch content was " + batch);
      }

      if (batch.getStatus() == StatusEnum.COMPLETED) {
        if (batch.getConceptIds() == null || batch.getConceptIds().isEmpty()) {
          throw new BatchSnowstormRequestFailedProblem(
              "Batch failed creating concepts on branch '"
                  + branch
                  + "' - batch completed with no concept ids");
        }

        Collection<String> batchIds = batch.getConceptIds().stream().map(String::valueOf).toList();
        if (!ids.containsAll(batchIds) || !batchIds.containsAll(ids)) {
          throw new BatchSnowstormRequestFailedProblem(
              "Failed create concepts in batch "
                  + batch.getId()
                  + " on branch '"
                  + branch
                  + "', created ids "
                  + Objects.requireNonNull(batch.getConceptIds()).stream()
                      .map(Object::toString)
                      .collect(Collectors.joining(","))
                  + " do not match request ids"
                  + String.join(", ", ids));
        }
        complete = true;
      } else if (batch.getStatus() == StatusEnum.FAILED) {
        throw new BatchSnowstormRequestFailedProblem(
            "The batch "
                + batch.getId()
                + " to create concepts "
                + batch.getConceptIds().stream()
                    .map(Object::toString)
                    .collect(Collectors.joining(","))
                + " failed on '"
                + branch
                + "' message was "
                + batch.getMessage());
      }
      log.fine("Sleeping for " + delayBetweenBatchChecks + " ms");
      Thread.sleep(delayBetweenBatchChecks);
      lastMessage = batch.getMessage();
    }

    if (!complete) {
      throw new BatchSnowstormRequestFailedProblem(
          "Batch failed creating concepts on branch '" + branch + "' message was " + lastMessage);
    }

    return getConceptsById(branch, ids);
  }

  public List<String> createRefsetMembers(
      String branch,
      List<SnowstormReferenceSetMemberViewComponent> referenceSetMemberViewComponents)
      throws InterruptedException {

    log.fine(
        "Bulk creating refset members: "
            + referenceSetMemberViewComponents.size()
            + " on branch: "
            + branch);
    URI location =
        Objects.requireNonNull(
                getRefsetMembersApi()
                    .createUpdateMembersBulkChangeWithResponseSpec(
                        branch, referenceSetMemberViewComponents)
                    .toBodilessEntity()
                    .block())
            .getHeaders()
            .getLocation();

    if (location == null) {
      throw new LingoProblem(
          "batch-failed",
          "Batch failed",
          HttpStatus.INTERNAL_SERVER_ERROR,
          "Batch failed creating refset members on branch '" + branch + "'");
    }

    boolean complete = false;
    int attempts = 0;
    List<String> refsetIds = Collections.emptyList();
    String lastMessage = "";
    while (!complete && attempts++ < maxBatchChecks) {
      log.fine("Checking batch status: " + location);
      SnowstormAsyncRefsetMemberChangeBatch batch =
          snowStormApiClient
              .get()
              .uri(location)
              .retrieve()
              .bodyToMono(SnowstormAsyncRefsetMemberChangeBatch.class)
              .block();

      if (batch == null) {
        throw new LingoProblem(
            "no-batch",
            "No batch from Snowstorm",
            HttpStatus.BAD_GATEWAY,
            "No batch from Snowstorm for creating refset members on branch '" + branch + "'");
      }

      if (batch.getStatus() == SnowstormAsyncRefsetMemberChangeBatch.StatusEnum.COMPLETED) {
        log.fine("Batch completed");
        if (referenceSetMemberViewComponents.size()
            != Objects.requireNonNull(batch.getMemberIds()).size()) {
          throw new BatchSnowstormRequestFailedProblem(
              "Failed checking catch refset member create branch '"
                  + branch
                  + "', created refset member count "
                  + batch.getMemberIds().size()
                  + " does not match request size"
                  + referenceSetMemberViewComponents.size());
        }
        complete = true;
        refsetIds = batch.getMemberIds();
      } else if (batch.getStatus() == SnowstormAsyncRefsetMemberChangeBatch.StatusEnum.FAILED) {
        throw new BatchSnowstormRequestFailedProblem(
            "Batch failed for refset members on branch '"
                + branch
                + "' message was "
                + batch.getMessage());
      }
      log.fine("Sleeping for " + delayBetweenBatchChecks + " ms");
      Thread.sleep(delayBetweenBatchChecks);
      lastMessage = batch.getMessage();
    }

    if (!complete) {
      throw new BatchSnowstormRequestFailedProblem(
          "Batch failed creating refset members on branch '"
              + branch
              + "' message was "
              + lastMessage);
    }

    return refsetIds;
  }

  public void removeRefsetMembers(String branch, Set<SnowstormReferenceSetMember> members) {

    Set<SnowstormReferenceSetMember> memberToDeactivate =
        members.stream()
            .filter(member -> Objects.requireNonNull(member.getReleased()).equals(true))
            .collect(Collectors.toSet());

    if (memberToDeactivate.isEmpty()) {
      log.fine(
          "Bulk deactivating refset members: "
              + memberToDeactivate.size()
              + " on branch: "
              + branch);
    }

    Set<String> memberIdsToDelete =
        members.stream()
            .filter(member -> Objects.requireNonNull(member.getReleased()).equals(false))
            .map(SnowstormReferenceSetMember::getMemberId)
            .collect(Collectors.toSet());

    if (memberIdsToDelete.isEmpty()) {
      log.fine(
          "Bulk deleting refset members: " + memberIdsToDelete.size() + " on branch: " + branch);
    }

    // Force must always be false, this is snowstorm api protection.
    if (memberIdsToDelete.isEmpty()) {
      Mono<Void> deleteMono =
          getRefsetMembersApi()
              .deleteMembers(
                  branch,
                  new SnowstormMemberIdsPojoComponent().memberIds(memberIdsToDelete),
                  false);

      deleteMono
          .then(Mono.just(201))
          .onErrorResume(
              WebClientResponseException.class,
              e -> {
                log.severe(
                    "Failed Deleting refset members: "
                        + memberIdsToDelete.size()
                        + " on branch: "
                        + branch);
                return Mono.just(e.getStatusCode().value());
              })
          .block();

      log.fine("Deleted refset members: " + memberIdsToDelete.size() + " on branch: " + branch);
    }

    if (!memberToDeactivate.isEmpty()) {
      List<SnowstormReferenceSetMemberViewComponent> deactivatedMembersWithActiveFalse =
          memberToDeactivate.stream()
              .map(
                  member ->
                      new SnowstormReferenceSetMemberViewComponent()
                          .active(false)
                          .refsetId(member.getRefsetId())
                          .moduleId(member.getModuleId())
                          .referencedComponentId(member.getReferencedComponentId())
                          .memberId(member.getMemberId()))
              .toList();
      createRefsetMemberships(branch, deactivatedMembersWithActiveFalse);
      log.fine(
          "Deleted refset members: "
              + deactivatedMembersWithActiveFalse.size()
              + " on branch: "
              + branch);
    }
  }

  public List<SnowstormConceptMini> getConceptsByTerm(String branch, String term) {
    if (term.length() > 250) {
      throw new LingoProblem(
          "invalid-search-parameters",
          "Search term can not have more than 250 characters.",
          HttpStatus.BAD_REQUEST,
          "Search term can not have more than 250 characters on branch '" + branch + "'");
    }
    SnowstormItemsPageObject page =
        getConceptsApi()
            .findConcepts(
                branch, null, null, null, term, null, null, null, null, null, null, null, null,
                null, null, null, null, false, 0, null, null, null)
            .block();

    if (page == null) {
      throw new LingoProblem(
          "no-page",
          "No page from Snowstorm for concepts",
          HttpStatus.INTERNAL_SERVER_ERROR,
          "No page from Snowstorm for concepts on branch '" + branch + "'");
    }

    return Objects.requireNonNull(page.getItems(), "page returned that contains null items")
        .stream()
        .map(SnowstormDtoUtil::fromLinkedHashMap)
        .toList();
  }

  public List<SnowstormConceptMini> getConceptsById(String branch, Set<String> ids) {
    SnowstormItemsPageObject page =
        getConceptsApi()
            .findConcepts(
                branch,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                ids,
                false,
                0,
                ids.size(),
                null,
                null)
            .block();

    if (page == null) {
      throw new LingoProblem(
          "no-page",
          "No page from Snowstorm for concepts",
          HttpStatus.INTERNAL_SERVER_ERROR,
          "No page from Snowstorm for concepts on branch '" + branch + "'");
    }

    return Objects.requireNonNull(page.getItems(), "page returned that contains null items")
        .stream()
        .map(SnowstormDtoUtil::fromLinkedHashMap)
        .toList();
  }

  public void checkForDuplicateFsn(String fsn, String branch) {
    String searchTerm = (fsn.length() > 250) ? fsn.substring(0, 250) : fsn;

    List<SnowstormConceptMini> existingConcepts = getConceptsByTerm(branch, searchTerm);

    boolean isDuplicate =
        existingConcepts.stream()
            .anyMatch(
                concept ->
                    Objects.requireNonNull(
                            Objects.requireNonNull(
                                    concept.getFsn(),
                                    "concept " + concept.getConceptId() + " contains no FSN")
                                .getTerm(),
                            "concept " + concept.getConceptId() + " FSN contains no term")
                        .equalsIgnoreCase(fsn));

    if (isDuplicate) {
      throw new ProductAtomicDataValidationProblem(
          String.format(
              "A concept with the name '%s' already exists. Cannot create a new concept with the same name.",
              fsn));
    }
  }

  @Cacheable(cacheNames = CacheConstants.COMPOSITE_UNIT_CACHE)
  public boolean isCompositeUnit(String branch, SnowstormConceptMini unit) {
    SnowstormItemsPageRelationship page = getRelationships(branch, unit.getConceptId()).block();
    if (page == null) {
      throw new LingoProblem(
          "no-page",
          "No page from Snowstorm for unit relationships",
          HttpStatus.INTERNAL_SERVER_ERROR,
          "No page from Snowstorm for unit relationships '"
              + unit.getConceptId()
              + "' on branch '"
              + branch
              + "'");
    }
    return Objects.requireNonNull(page.getItems(), "page returned containing null items").stream()
        .filter(r -> r.getActive() != null && r.getActive())
        .anyMatch(
            r ->
                r.getTypeId().equals(AmtConstants.HAS_NUMERATOR_UNIT.getValue())
                    || r.getTypeId().equals(AmtConstants.HAS_DENOMINATOR_UNIT.getValue()));
  }

  @Cacheable(cacheNames = CacheConstants.UNIT_NUMERATOR_DENOMINATOR_CACHE)
  public Pair<SnowstormConceptMini, SnowstormConceptMini> getNumeratorAndDenominatorUnit(
      String branch, String unit) {
    List<SnowstormRelationship> relationships =
        Objects.requireNonNull(
                getRelationships(branch, unit).block(), "unit should have relationships: " + unit)
            .getItems();

    if (relationships == null) {
      throw new ProductAtomicDataValidationProblem(
          "Composite unit " + unit + " has no relationships");
    }

    List<SnowstormConceptMini> numerators =
        relationships.stream()
            .filter(r -> r.getTypeId().equals(AmtConstants.HAS_NUMERATOR_UNIT.getValue()))
            .map(SnowstormRelationship::getTarget)
            .toList();

    if (numerators.size() != 1) {
      throw new ProductAtomicDataValidationProblem(
          "Composite unit "
              + unit
              + " has unexpected number of numerator unit "
              + numerators.size());
    }

    List<SnowstormConceptMini> denominators =
        relationships.stream()
            .filter(r -> r.getTypeId().equals(AmtConstants.HAS_DENOMINATOR_UNIT.getValue()))
            .map(SnowstormRelationship::getTarget)
            .toList();

    if (denominators.size() != 1) {
      throw new ProductAtomicDataValidationProblem(
          "Composite unit "
              + unit
              + " has unexpected number of denominator unit "
              + denominators.size());
    }

    return Pair.of(numerators.iterator().next(), denominators.iterator().next());
  }

  public SnowstormReferenceSetMemberViewComponent createRefsetMembership(
      String branch, String refsetId, String memberId, boolean active, String moduleId) {
    SnowstormReferenceSetMemberViewComponent refsetMember =
        new SnowstormReferenceSetMemberViewComponent();
    refsetMember
        .active(active)
        .refsetId(refsetId)
        .referencedComponentId(memberId)
        .moduleId(moduleId);
    return createRefsetMembership(branch, refsetMember);
  }

  public SnowstormReferenceSetMemberViewComponent createRefsetMembership(
      String branch, SnowstormReferenceSetMemberViewComponent refsetMember) {
    return getRefsetMembersApi().createMember(branch, refsetMember).block();
  }

  public void createRefsetMemberships(
      String branch, List<SnowstormReferenceSetMemberViewComponent> refsetMember) {
    getRefsetMembersApi()
        .createUpdateMembersBulkChangeWithResponseSpec(branch, refsetMember)
        .onStatus(
            HttpStatusCode::isError,
            response -> {
              log.severe("Error creating refset members: " + response.statusCode());
              return Mono.error(
                  new WebClientResponseException(
                      response.statusCode().value(),
                      "Error creating refset members",
                      null,
                      null,
                      null));
            })
        .toBodilessEntity()
        .block();
  }

  @Cacheable(cacheNames = CacheConstants.SNOWSTORM_STATUS_CACHE)
  public SnowstormStatus getStatus(String codeSystem) {
    String effectiveDate = ClientHelper.getEffectiveDate(getApiClient().getWebClient(), codeSystem);
    Status status = ClientHelper.getStatus(getApiClient().getWebClient(), "version");
    return SnowstormStatus.builder()
        .effectiveDate(effectiveDate)
        .version(status.getVersion())
        .running(status.isRunning())
        .build();
  }

  public Collection<String> conceptIdsThatExist(String branch, Set<String> specifiedConceptIds) {
    Mono<SnowstormItemsPageObject> concepts =
        getConceptsApi()
            .findConcepts(
                branch,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                specifiedConceptIds,
                true,
                0,
                specifiedConceptIds.size(),
                null,
                null);
    return concepts
        .map(
            p ->
                Objects.requireNonNull(p.getItems(), "page returned containing null items").stream()
                    .map(o -> (String) o)
                    .toList())
        .block();
  }

  public Mono<List<String>> getConceptIdsChangedOnTask(String branch) {
    if (!BranchPatternMatcher.isTaskPattern(branch)) {
      return Mono.fromSupplier(List::of);
    }
    return getConceptsForBranch(branch);
  }

  public Mono<List<String>> getConceptIdsChangedOnProject(String branch) {
    String project = branch;
    if (BranchPatternMatcher.isTaskPattern(branch)) {
      project = BranchPatternMatcher.getProjectFromTask(branch);
    }
    return getConceptsForBranch(project);
  }

  @NotNull
  private Mono<List<String>> getConceptsForBranch(String branch) {
    Mono<SnowstormItemsPageObject> concepts =
        getConceptsApi()
            .findConcepts(
                branch, null, null, null, null, null, null, null, null, null, null, null, null,
                null, false, null, null, true, 0, 500, null, null);

    return concepts.map(
        p ->
            p.getItems() == null ? List.of() : p.getItems().stream().map(o -> (String) o).toList());
  }
}
