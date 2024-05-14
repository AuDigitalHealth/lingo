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
import au.csiro.snowstorm_client.model.SnowstormConceptView;
import au.csiro.snowstorm_client.model.SnowstormItemsPageObject;
import au.csiro.snowstorm_client.model.SnowstormItemsPageReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormItemsPageRelationship;
import au.csiro.snowstorm_client.model.SnowstormMemberSearchRequestComponent;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import com.csiro.snomio.auth.helper.AuthHelper;
import com.csiro.snomio.exception.BatchSnowstormRequestFailedProblem;
import com.csiro.snomio.exception.SingleConceptExpectedProblem;
import com.csiro.snomio.exception.SnomioProblem;
import com.csiro.snomio.helper.ClientHelper;
import com.csiro.snomio.models.ServiceStatus.Status;
import com.csiro.snomio.util.CacheConstants;
import com.csiro.snomio.util.SnowstormDtoUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.logging.Level;
import java.util.stream.Collectors;
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
import org.springframework.web.reactive.function.client.WebClientResponseException.NotFound;
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
  private final AuthHelper authHelper;

  @Value("${snomio.snowstorm.batch.checks.delay:500}")
  private int delayBetweenBatchChecks;

  @Value("${snomio.snowstorm.max.batch.checks:100}")
  private int maxBatchChecks;

  @Autowired
  public SnowstormClient(
      @Qualifier("snowStormApiClient") WebClient snowStormApiClient,
      @Value("${ihtsdo.snowstorm.api.url}") String snowstormUrl,
      ObjectMapper objectMapper,
      AuthHelper authHelper) {
    this.snowStormApiClient = snowStormApiClient;
    this.snowstormUrl = snowstormUrl;
    this.objectMapper = objectMapper;
    this.authHelper = authHelper;
  }

  private static String populateParameters(String ecl, Pair<String, Object>[] params) {
    if (params != null) {
      for (Pair<String, Object> param : params) {
        ecl = ecl.replaceAll(param.getFirst(), param.getSecond().toString());
      }
    }

    return ecl;
  }

  public SnowstormConceptMini getConcept(String branch, String id) {
    ConceptsApi api = getConceptsApi();

    return api.findConcept(branch, id, "en").block();
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
        api.findConcepts(
                branch, null, null, null, null, null, null, null, null, null, null, null, null,
                null, null, ecl, null, true, offset, limit, null, "en")
            .block();

    Instant end = Instant.now();

    if (log.isLoggable(Level.FINE)) {
      log.fine(
          "User "
              + authHelper.getImsUser().getLogin()
              + " executed id only ECL: "
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
          "Too many concepts found for ecl '" + ecl + "' on branch '" + branch + "'");
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
        api.findConcepts(
                branch, null, null, null, null, null, null, null, null, null, null, null, null,
                null, null, ecl, null, false, offset, limit, null, "en")
            .block();

    Instant end = Instant.now();

    if (log.isLoggable(Level.FINE)) {
      log.fine(
          "User "
              + authHelper.getImsUser().getLogin()
              + " executed ECL: "
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
      String branch, Collection<String> concepts, int offset, int limit) {
    SnowstormMemberSearchRequestComponent searchRequestComponent =
        new SnowstormMemberSearchRequestComponent();
    searchRequestComponent.active(true).referencedComponentIds(List.copyOf(concepts));
    return getRefsetMembersApi()
        .findRefsetMembers(branch, searchRequestComponent, offset, limit, "en");
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
    return api.getBrowserConcepts(branch, request, "en");
  }

  public Mono<SnowstormItemsPageRelationship> getRelationships(String branch, String conceptId) {
    RelationshipsApi api = new RelationshipsApi(getApiClient());

    return api.findRelationships(
        branch, true, null, null, conceptId, null, null, null, null, null, null, "en");
  }

  public SnowstormConceptView createConcept(
      String branch, SnowstormConceptView concept, boolean validate) {
    return getConceptsApi().createConcept(branch, concept, validate, "en").block();
  }

  public List<SnowstormConceptMini> createConcepts(
      String branch, List<SnowstormConceptView> concepts) {

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
      log.fine("Batch status: " + batch.getStatus());
      if (batch.getStatus() == StatusEnum.COMPLETED) {
        Collection<String> batchIds = batch.getConceptIds().stream().map(String::valueOf).toList();
        if (!ids.containsAll(batchIds) || !batchIds.containsAll(ids)) {
          throw new BatchSnowstormRequestFailedProblem(
              "Failed create concepts batch on branch '"
                  + branch
                  + "', created ids "
                  + String.join(", " + batch.getConceptIds())
                  + " do not match request ids"
                  + String.join(", ", ids));
        }
        complete = true;
      } else if (batch.getStatus() == StatusEnum.FAILED) {
        throw new BatchSnowstormRequestFailedProblem(
            "Failed checking status of the batch on '"
                + branch
                + "' message was "
                + batch.getMessage());
      }
      try {
        log.fine("Sleeping for " + delayBetweenBatchChecks + " ms");
        Thread.sleep(delayBetweenBatchChecks);
      } catch (InterruptedException e) {
        throw new BatchSnowstormRequestFailedProblem(e);
      }
      lastMessage = batch.getMessage();
    }

    if (!complete) {
      throw new BatchSnowstormRequestFailedProblem(
          "Batch failed creating concepts on branch '" + branch + "' message was " + lastMessage);
    }

    List<SnowstormConceptMini> conceptsById = getConceptsById(branch, ids);
    return conceptsById;
  }

  public List<String> createRefsetMembers(
      String branch,
      List<SnowstormReferenceSetMemberViewComponent> referenceSetMemberViewComponents) {

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
      SnowstormAsyncRefsetMemberChangeBatch batch =
          snowStormApiClient
              .get()
              .uri(location)
              .retrieve()
              .bodyToMono(SnowstormAsyncRefsetMemberChangeBatch.class)
              .block();
      if (batch.getStatus() == SnowstormAsyncRefsetMemberChangeBatch.StatusEnum.COMPLETED) {
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
      try {
        Thread.sleep(delayBetweenBatchChecks);
      } catch (InterruptedException e) {
        throw new BatchSnowstormRequestFailedProblem(e);
      }
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

  public List<SnowstormConceptMini> getConceptsById(String branch, Set<String> ids) {
    return getConceptsApi()
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
        .block()
        .getItems()
        .stream()
        .map(o -> SnowstormDtoUtil.fromLinkedHashMap(o))
        .toList();
  }

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

  public boolean conceptExists(String branch, String conceptId) {
    try {
      return getConcept(branch, conceptId) != null;
    } catch (NotFound e) {
      return false;
    }
  }

  @Cacheable(cacheNames = CacheConstants.SNOWSTORM_STATUS_CACHE)
  public Status getStatus() {
    return ClientHelper.getStatus(getApiClient().getWebClient(), "version");
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
}
