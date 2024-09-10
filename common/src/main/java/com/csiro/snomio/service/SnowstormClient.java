package com.csiro.snomio.service;

import static com.csiro.snomio.util.AmtConstants.HAS_DENOMINATOR_UNIT;
import static com.csiro.snomio.util.AmtConstants.HAS_NUMERATOR_UNIT;
import static com.csiro.snomio.util.AmtConstants.SCT_AU_MODULE;

import au.csiro.snowstorm_client.api.ConceptsApi;
import au.csiro.snowstorm_client.api.RefsetMembersApi;
import au.csiro.snowstorm_client.api.RelationshipsApi;
import au.csiro.snowstorm_client.invoker.ApiClient;
import au.csiro.snowstorm_client.model.SnowstormAsyncConceptChangeBatch;
import au.csiro.snowstorm_client.model.SnowstormAsyncConceptChangeBatch.StatusEnum;
import au.csiro.snowstorm_client.model.SnowstormAsyncRefsetMemberChangeBatch;
import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormConceptBulkLoadRequestComponent;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormConceptSearchRequest;
import au.csiro.snowstorm_client.model.SnowstormConceptView;
import au.csiro.snowstorm_client.model.SnowstormItemsPageObject;
import au.csiro.snowstorm_client.model.SnowstormItemsPageReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormItemsPageRelationship;
import au.csiro.snowstorm_client.model.SnowstormMemberIdsPojoComponent;
import au.csiro.snowstorm_client.model.SnowstormMemberSearchRequestComponent;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import com.csiro.snomio.exception.BatchSnowstormRequestFailedProblem;
import com.csiro.snomio.exception.ProductAtomicDataValidationProblem;
import com.csiro.snomio.exception.SingleConceptExpectedProblem;
import com.csiro.snomio.exception.SnomioProblem;
import com.csiro.snomio.log.SnowstormLogger;
import com.csiro.snomio.service.ServiceStatus.SnowstormStatus;
import com.csiro.snomio.service.ServiceStatus.Status;
import com.csiro.snomio.util.AmtConstants;
import com.csiro.snomio.util.BranchPatternMatcher;
import com.csiro.snomio.util.CacheConstants;
import com.csiro.snomio.util.ClientHelper;
import com.csiro.snomio.util.SnowstormDtoUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
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

  public SnowstormConceptMini getConceptFromEcl(String branch, String ecl, Long id)
      throws SingleConceptExpectedProblem {
    return getConceptFromEcl(branch, ecl, Pair.of("<id>", id));
  }

  public SnowstormConceptMini getConceptFromEcl(
      String branch, String ecl, Pair<String, Object>... params)
      throws SingleConceptExpectedProblem {
    ecl = populateParameters(ecl, params);
    Collection<SnowstormConceptMini> concepts = getConceptsFromEcl(branch, ecl, 0, 2);
    if (concepts.size() != 1) {
      throw new SingleConceptExpectedProblem(branch, ecl, concepts);
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

  public Collection<String> getConceptsIdsFromEcl(
      String branch, String ecl, long id, int offset, int limit) {
    return getConceptIdsFromEcl(branch, ecl, offset, limit, Pair.of("<id>", id));
  }

  public Collection<String> getConceptIdsFromEcl(
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
    return page.getItems().stream().map(o -> (String) o).toList();
  }

  private void validatePage(String branch, String ecl, SnowstormItemsPageObject page) {
    if (page != null && page.getTotal() > page.getLimit()) {
      throw new SnomioProblem(
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
    } else if (page == null) {
      throw new SnomioProblem(
          "no-page",
          "No page from Snowstorm for ECL",
          HttpStatus.INTERNAL_SERVER_ERROR,
          "No page from Snowstorm for ECL '" + ecl + "' on branch '" + branch + "'");
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
    return page.getItems().stream()
        .map(SnowstormDtoUtil::fromLinkedHashMap)
        .filter(SnowstormConceptMini::getActive)
        .toList();
  }

  public Mono<SnowstormItemsPageReferenceSetMember> getRefsetMembers(
      String branch, Collection<String> concepts, String referenceSetId, int offset, int limit) {
    SnowstormMemberSearchRequestComponent searchRequestComponent =
        new SnowstormMemberSearchRequestComponent();
    searchRequestComponent.active(true);
    if (concepts != null) {
      searchRequestComponent.referencedComponentIds(List.copyOf(concepts));
    }
    if (referenceSetId != null) {
      searchRequestComponent.referenceSet(referenceSetId);
    }
    return getRefsetMembersApi()
        .findRefsetMembers(
            branch, searchRequestComponent, offset, Math.min(limit, 10000), languageHeader);
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

  public List<SnowstormConceptMini> createConcepts(
      String branch, List<SnowstormConceptView> concepts) throws InterruptedException {

    if (log.isLoggable(Level.FINE)) {
      log.fine("Bulk creating concepts: " + concepts.size() + " on branch: " + branch);
    }
    URI location =
        getConceptsApi()
            .createUpdateConceptBulkChangeWithResponseSpec(branch, concepts)
            .toBodilessEntity()
            .block()
            .getHeaders()
            .getLocation();

    if (location == null) {
      throw new BatchSnowstormRequestFailedProblem(
          "Batch failed creating concepts on branch '" + branch + "'");
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
      if (log.isLoggable(Level.FINE)) {
        log.fine("Batch status: " + batch.getStatus());
        log.fine("Batch content was " + batch);
      }
      if (batch.getStatus() == StatusEnum.COMPLETED) {
        Collection<String> batchIds = batch.getConceptIds().stream().map(String::valueOf).toList();
        if (!ids.containsAll(batchIds) || !batchIds.containsAll(ids)) {
          throw new BatchSnowstormRequestFailedProblem(
              "Failed create concepts in batch "
                  + batch.getId()
                  + " on branch '"
                  + branch
                  + "', created ids "
                  + batch.getConceptIds().stream()
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
        getRefsetMembersApi()
            .createUpdateMembersBulkChangeWithResponseSpec(branch, referenceSetMemberViewComponents)
            .toBodilessEntity()
            .block()
            .getHeaders()
            .getLocation();

    if (location == null) {
      throw new SnomioProblem(
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
      if (batch.getStatus() == SnowstormAsyncRefsetMemberChangeBatch.StatusEnum.COMPLETED) {
        log.fine("Batch completed");
        if (referenceSetMemberViewComponents.size() != batch.getMemberIds().size()) {
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

  public int removeRefsetMembers(
      String branch, SnowstormMemberIdsPojoComponent members, boolean force) {

    log.fine(
        "Bulk deleting refset members: " + members.getMemberIds().size() + " on branch: " + branch);

    Mono<Void> deleteMono = getRefsetMembersApi().deleteMembers(branch, members, force);
    AtomicInteger returnStatusCode = new AtomicInteger(500);
    deleteMono
        .then(Mono.just(201))
        .onErrorResume(WebClientResponseException.class, e -> Mono.just(e.getRawStatusCode()))
        .doOnNext(returnStatusCode::set)
        .block();

    if (returnStatusCode.get() == 201) {
      log.fine(
          "Deleted refset members: " + members.getMemberIds().size() + " on branch: " + branch);
    } else {
      log.severe(
          "Failed Deleting refset members: "
              + members.getMemberIds().size()
              + " on branch: "
              + branch);
    }
    return returnStatusCode.get();
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
      throw new SnomioProblem(
          "no-page",
          "No page from Snowstorm for concepts",
          HttpStatus.INTERNAL_SERVER_ERROR,
          "No page from Snowstorm for concepts on branch '" + branch + "'");
    }

    return page.getItems().stream().map(SnowstormDtoUtil::fromLinkedHashMap).toList();
  }

  @Cacheable(cacheNames = CacheConstants.COMPOSITE_UNIT_CACHE)
  public boolean isCompositeUnit(String branch, SnowstormConceptMini unit) {
    SnowstormItemsPageRelationship page = getRelationships(branch, unit.getConceptId()).block();
    if (page == null) {
      throw new SnomioProblem(
          "no-page",
          "No page from Snowstorm for unit relationships",
          HttpStatus.INTERNAL_SERVER_ERROR,
          "No page from Snowstorm for unit relationships '"
              + unit.getConceptId()
              + "' on branch '"
              + branch
              + "'");
    }
    return page.getItems().stream()
        .filter(r -> r.getActive())
        .anyMatch(
            r ->
                r.getTypeId().equals(HAS_NUMERATOR_UNIT.getValue())
                    || r.getTypeId().equals(HAS_DENOMINATOR_UNIT.getValue()));
  }

  @Cacheable(cacheNames = CacheConstants.UNIT_NUMERATOR_DENOMINATOR_CACHE)
  public Pair<SnowstormConceptMini, SnowstormConceptMini> getNumeratorAndDenominatorUnit(
      String branch, String unit) {
    List<SnowstormRelationship> relationships = getRelationships(branch, unit).block().getItems();

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
      String branch, String refsetId, String memberId) {
    SnowstormReferenceSetMemberViewComponent refsetMember =
        new SnowstormReferenceSetMemberViewComponent();
    refsetMember
        .active(true)
        .refsetId(refsetId)
        .referencedComponentId(memberId)
        .moduleId(SCT_AU_MODULE.getValue());
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
    return concepts.map(p -> p.getItems().stream().map(o -> (String) o).toList()).block();
  }

  public Mono<List<String>> getConceptIdsChangedOnTask(String branch) {
    if (!BranchPatternMatcher.isTaskPattern(branch)) {
      return Mono.fromSupplier(List::of);
    }
    Mono<SnowstormItemsPageObject> concepts =
        getConceptsApi()
            .findConcepts(
                branch, null, null, null, null, null, null, null, null, null, null, null, null,
                null, false, null, null, true, 0, 500, null, null);

    return concepts.map(
        p ->
            p.getItems() == null ? List.of() : p.getItems().stream().map(o -> (String) o).toList());
  }

  public Mono<List<String>> getConceptIdsChangedOnProject(String branch) {
    String project = branch;
    if (BranchPatternMatcher.isTaskPattern(branch)) {
      project = BranchPatternMatcher.getProjectFromTask(branch);
    }
    Mono<SnowstormItemsPageObject> concepts =
        getConceptsApi()
            .findConcepts(
                project, null, null, null, null, null, null, null, null, null, null, null, null,
                null, false, null, null, true, 0, 500, null, null);

    return concepts.map(
        p ->
            p.getItems() == null ? List.of() : p.getItems().stream().map(o -> (String) o).toList());
  }
}
