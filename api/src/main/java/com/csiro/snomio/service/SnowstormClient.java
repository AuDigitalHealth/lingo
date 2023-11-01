package com.csiro.snomio.service;

import static com.csiro.snomio.util.AmtConstants.HAS_DENOMINATOR_UNIT;
import static com.csiro.snomio.util.AmtConstants.HAS_NUMERATOR_UNIT;
import static com.csiro.snomio.util.AmtConstants.SCT_AU_MODULE;

import au.csiro.snowstorm_client.api.ConceptsApi;
import au.csiro.snowstorm_client.api.RefsetMembersApi;
import au.csiro.snowstorm_client.api.RelationshipsApi;
import au.csiro.snowstorm_client.invoker.ApiClient;
import au.csiro.snowstorm_client.model.SnowstormConceptBulkLoadRequestComponent;
import au.csiro.snowstorm_client.model.SnowstormConceptComponent;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormConceptMiniComponent;
import au.csiro.snowstorm_client.model.SnowstormConceptViewComponent;
import au.csiro.snowstorm_client.model.SnowstormItemsPageObject;
import au.csiro.snowstorm_client.model.SnowstormItemsPageObjectComponent;
import au.csiro.snowstorm_client.model.SnowstormItemsPageReferenceSetMemberComponent;
import au.csiro.snowstorm_client.model.SnowstormItemsPageRelationshipComponent;
import au.csiro.snowstorm_client.model.SnowstormMemberSearchRequestComponent;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import com.csiro.snomio.exception.SingleConceptExpectedProblem;
import com.csiro.snomio.exception.SnomioProblem;
import com.csiro.snomio.util.SnowstormDtoUtil;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import lombok.Getter;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.util.Pair;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException.NotFound;
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

  @Autowired
  public SnowstormClient(
      @Qualifier("snowStormApiClient") WebClient snowStormApiClient,
      @Value("${ihtsdo.snowstorm.api.url}") String snowstormUrl) {
    this.snowStormApiClient = snowStormApiClient;
    this.snowstormUrl = snowstormUrl;
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

  public SnowstormConceptMiniComponent getConceptFromEcl(String branch, String ecl, Long id)
      throws SingleConceptExpectedProblem {
    return getConceptFromEcl(branch, ecl, Pair.of("<id>", id));
  }

  public SnowstormConceptMiniComponent getConceptFromEcl(
      String branch, String ecl, Pair<String, Object>... params)
      throws SingleConceptExpectedProblem {
    ecl = populateParameters(ecl, params);
    Collection<SnowstormConceptMiniComponent> concepts = getConceptsFromEcl(branch, ecl, 0, 2);
    if (concepts.size() != 1) {
      throw new SingleConceptExpectedProblem(branch, ecl, concepts);
    }
    return concepts.iterator().next();
  }

  public Optional<SnowstormConceptMiniComponent> getOptionalConceptFromEcl(
      String branch, String ecl) {
    return getOptionalConceptFromEcl(branch, ecl, (Pair<String, Object>) null);
  }

  public Optional<SnowstormConceptMiniComponent> getOptionalConceptFromEcl(
      String branch, String ecl, Pair<String, Object>... params)
      throws SingleConceptExpectedProblem {
    ecl = populateParameters(ecl, params);
    Collection<SnowstormConceptMiniComponent> concepts = getConceptsFromEcl(branch, ecl, 0, 2);
    if (concepts.size() > 1) {
      throw new SingleConceptExpectedProblem(branch, ecl, concepts);
    }
    return concepts.stream().findFirst();
  }

  public Collection<SnowstormConceptMiniComponent> getConceptsFromEcl(
      String branch, String ecl, String id, int offset, int limit) {
    return getConceptsFromEcl(branch, ecl, offset, limit, Pair.of("<id>", id));
  }

  public Collection<SnowstormConceptMiniComponent> getConceptsFromEcl(
      String branch, String ecl, int offset, int limit, Pair<String, Object>... params) {
    ecl = populateParameters(ecl, params);

    ConceptsApi api = getConceptsApi();

    SnowstormItemsPageObject page =
        api.findConcepts(
                branch, true, null, null, null, null, null, null, null, null, null, ecl, null, null,
                null, null, null, null, offset, limit, null, "en")
            .block();

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
    return page.getItems().stream().map(SnowstormDtoUtil::fromLinkedHashMap).toList();
  }

  public Collection<SnowstormConceptMiniComponent> getDescendants(
      String branch, long conceptId, int offset, int limit) {
    ConceptsApi api = getConceptsApi();

    SnowstormItemsPageObjectComponent page =
        api.findConceptDescendants(branch, Long.toString(conceptId), false, offset, limit, "en")
            .block();

    if (page != null && page.getTotal() > page.getLimit()) {
      throw new SnomioProblem(
          "too-many-concepts",
          "Too many concepts",
          HttpStatus.INTERNAL_SERVER_ERROR,
          "Too many concepts found for descendants of '"
              + conceptId
              + "' on branch '"
              + branch
              + "'");
    } else if (page == null) {
      throw new SnomioProblem(
          "no-page",
          "No page from Snowstorm for descendants",
          HttpStatus.INTERNAL_SERVER_ERROR,
          "No page from Snowstorm for descendants of '"
              + conceptId
              + "' on branch '"
              + branch
              + "'");
    }

    return page.getItems().stream().map(SnowstormDtoUtil::fromLinkedHashMap).toList();
  }

  public List<SnowstormConceptComponent> getBrowserConceptsFromEcl(
      String branch, String ecl, int offset, int limit, Pair<String, Object>... params) {
    List<String> conceptIds =
        getConceptsFromEcl(branch, ecl, offset, limit, params).stream()
            .map(cs -> cs.getConceptId())
            .toList();
    ConceptsApi api = getConceptsApi();
    SnowstormConceptBulkLoadRequestComponent request =
        new SnowstormConceptBulkLoadRequestComponent();
    request.conceptIds(conceptIds);
    return api.getBrowserConcepts(branch, request, "en").collectList().block();
  }

  public List<SnowstormConceptComponent> getBrowserConceptsFromEcl(
      String branch, String ecl, Long id, int offset, int limit) {
    return getBrowserConceptsFromEcl(branch, ecl, offset, limit, Pair.of("<id>", id));
  }

  public Mono<SnowstormItemsPageReferenceSetMemberComponent> getRefsetMembers(
      String branch, Collection<SnowstormConceptMiniComponent> concepts, int offset, int limit) {
    SnowstormMemberSearchRequestComponent searchRequestComponent =
        new SnowstormMemberSearchRequestComponent();
    searchRequestComponent
        .active(true)
        .referencedComponentIds(concepts.stream().map(c -> (Object) c.getConceptId()).toList());
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

  public Mono<List<SnowstormConceptComponent>> getBrowserConcepts(
      String branch, Collection<SnowstormConceptMiniComponent> concepts) {
    ConceptsApi api = getConceptsApi();
    SnowstormConceptBulkLoadRequestComponent request =
        new SnowstormConceptBulkLoadRequestComponent();
    request.conceptIds(concepts.stream().map(c -> c.getConceptId()).toList());
    return api.getBrowserConcepts(branch, request, "en").collectList();
  }

  public Mono<SnowstormItemsPageRelationshipComponent> getRelationships(
      String branch, String conceptId) {
    RelationshipsApi api = new RelationshipsApi(getApiClient());

    return api.findRelationships(
        branch, true, null, null, conceptId, null, null, null, null, null, null, "en");
  }

  public SnowstormConceptViewComponent createConcept(
      String branch, SnowstormConceptViewComponent concept, boolean validate) {
    return getConceptsApi().createConcept(branch, concept, validate, "en").block();
  }

  public SnowstormConceptMiniComponent toSnowstormConceptMini(SnowstormConceptViewComponent view) {
    return new SnowstormConceptMiniComponent()
        .conceptId(view.getConceptId())
        .fsn(view.getFsn())
        .pt(view.getPt())
        .idAndFsnTerm(view.getConceptId() + "|" + view.getFsn().getTerm() + "|")
        .definitionStatus(view.getDefinitionStatusId())
        .active(view.getActive());
  }

  public boolean isCompositeUnit(String branch, SnowstormConceptMiniComponent unit) {
    SnowstormItemsPageRelationshipComponent page =
        getRelationships(branch, unit.getConceptId()).block();
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
                r.getTypeId().equals(HAS_NUMERATOR_UNIT)
                    || r.getTypeId().equals(HAS_DENOMINATOR_UNIT));
  }

  public SnowstormReferenceSetMemberViewComponent createRefsetMembership(
      String branch, String refsetId, String memberId) {
    SnowstormReferenceSetMemberViewComponent refsetMember =
        new SnowstormReferenceSetMemberViewComponent();
    refsetMember
        .active(true)
        .refsetId(refsetId)
        .referencedComponentId(memberId)
        .moduleId(SCT_AU_MODULE);
    return getRefsetMembersApi().createMember(branch, refsetMember).block();
  }

  public boolean conceptExists(String branch, String conceptId) {
    try {
      return getConcept(branch, conceptId) != null;
    } catch (NotFound e) {
      return false;
    }
  }
}
