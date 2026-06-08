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

import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getFsnFromDescriptions;

import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormDescription;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.configuration.FieldBindingConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.configuration.model.NonDefiningPropertyDefinition;
import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.Edge;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.OriginalNode;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.bulk.ProductUpdateCreationDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.ProductDetails;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty;
import au.gov.digitalhealth.lingo.product.update.ProductDescriptionUpdateRequest;
import au.gov.digitalhealth.lingo.product.update.ProductPropertiesUpdateRequest;
import au.gov.digitalhealth.lingo.product.update.ProductUpdateRequest;
import au.gov.digitalhealth.lingo.product.update.ProductUpdateState;
import au.gov.digitalhealth.lingo.service.validators.ValidationResult;
import au.gov.digitalhealth.lingo.util.InactivationReason;
import au.gov.digitalhealth.lingo.util.NonDefiningPropertiesConverter;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import au.gov.digitalhealth.lingo.validation.AuthoringValidation;
import au.gov.digitalhealth.tickets.models.BulkProductAction;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.repository.BulkProductActionRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import au.gov.digitalhealth.tickets.service.TicketServiceImpl;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.groups.Default;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.NonNull;
import lombok.extern.java.Log;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

@Log
@Service
@Validated({AuthoringValidation.class, Default.class})
public class ProductUpdateService {
  private static final String SNOMED_CT_CORE_MODULE_ID = "900000000000207008";
  private static final String CORE_FSN_EDIT_ERROR =
      "Cannot edit or inactivate SNOMED International FSN for core module concepts.";
  private static final String CORE_ACCEPTABILITY_EDIT_ERROR =
      "Cannot change the acceptability for SNOMED International managed language reference sets."
          + " Editable language reference sets are: %s";
  private static final String CORE_FSN_MISSING_ERROR =
      "SNOMED International FSN cannot be removed from core module concepts.";

  SnowstormClient snowstormClient;
  TicketServiceImpl ticketService;

  TicketRepository ticketRepository;
  FieldBindingConfiguration fieldBindingConfiguration;
  Models models;
  ProductSummaryService productSummaryService;
  ProductCalculationServiceFactory productCalculationServiceFactory;

  BulkProductActionRepository bulkProductActionRepository;

  BlobStorageService blobStorageService;

  public ProductUpdateService(
      SnowstormClient snowstormClient,
      TicketServiceImpl ticketService,
      FieldBindingConfiguration fieldBindingConfiguration,
      Models models,
      ProductSummaryService productSummaryService,
      ProductCalculationServiceFactory productCalculationServiceFactory,
      TicketRepository ticketRepository,
      BulkProductActionRepository bulkProductActionRepository,
      BlobStorageService blobStorageService) {
    this.snowstormClient = snowstormClient;

    this.ticketService = ticketService;
    this.fieldBindingConfiguration = fieldBindingConfiguration;
    this.ticketRepository = ticketRepository;
    this.bulkProductActionRepository = bulkProductActionRepository;
    this.models = models;
    this.productSummaryService = productSummaryService;
    this.productCalculationServiceFactory = productCalculationServiceFactory;
    this.blobStorageService = blobStorageService;
  }

  private static String getNonDefiningPropertyKeyForRelationship(
      SnowstormRelationship relationship) {
    String value;
    if (relationship.getConcreteValue() != null) {
      value = relationship.getConcreteValue().getValue();
    } else {
      if (relationship.getDestinationId() == null) {
        throw new ProductAtomicDataValidationProblem(
            "Destination ID is null for relationship: " + relationship);
      }
      value = relationship.getDestinationId();
    }

    return relationship.getTypeId() + " " + value;
  }

  private static String getNonDefiningPropertyKey(
      NonDefiningPropertyDefinition nonDefiningPropertyDefinition, NonDefiningProperty prop) {

    final String value =
        prop.getValue() == null ? prop.getValueObject().getConceptId() : prop.getValue();

    return nonDefiningPropertyDefinition.getIdentifier() + " " + value;
  }

  public BulkProductAction updateProductDescriptions(
      String branch, String productId, @Valid ProductUpdateRequest productUpdateRequest) {

    snowstormClient.throwIfBranchLocked(branch);

    String conceptId = productUpdateRequest.getConceptId();
    log.info(String.format("Product update for %s commencing", conceptId));
    ProductDescriptionUpdateRequest productDescriptionUpdateRequest =
        productUpdateRequest.getDescriptionUpdate();
    ProductPropertiesUpdateRequest productExternalIdentifierUpdateRequest =
        productUpdateRequest.getPropertiesUpdateRequest();

    if (productExternalIdentifierUpdateRequest != null) {
      throw new ProductAtomicDataValidationProblem(
          "Description edits no longer support non-defining property changes");
    }

    Ticket ticket = ticketRepository.findById(productUpdateRequest.getTicketId()).orElseThrow();
    String fsn =
        getFsnFromDescriptions(productDescriptionUpdateRequest.getDescriptions()).getTerm();
    BulkProductAction productUpdate = BulkProductAction.builder().ticket(ticket).name(fsn).build();
    ProductUpdateState historicState = ProductUpdateState.builder().build();
    ProductUpdateState updateState = ProductUpdateState.builder().build();
    ProductUpdateCreationDetails productUpdateCreationDetails =
        ProductUpdateCreationDetails.builder()
            .productId(productId)
            .historicState(historicState)
            .updatedState(updateState)
            .build();

    updateProductDescriptions(
        branch, conceptId, productDescriptionUpdateRequest, productUpdateCreationDetails);
    productUpdate.setDetails(productUpdateCreationDetails);

    Optional<BulkProductAction> existingBulkProductAction =
        bulkProductActionRepository.findByNameAndTicketId(
            productUpdate.getName(), productUpdateRequest.getTicketId());
    if (existingBulkProductAction.isPresent()) {
      productUpdate.setName(productUpdate.getName() + Instant.now().toString());
    }
    log.info(
        String.format(
            "Product description update for %s saving on ticket %s", conceptId, ticket.getId()));
    return bulkProductActionRepository.save(productUpdate);
  }

  private ProductUpdateCreationDetails updateProductDescriptions(
      String branch,
      String conceptId,
      @Valid ProductDescriptionUpdateRequest productDescriptionUpdateRequest,
      ProductUpdateCreationDetails productUpdateCreationDetails) {

    SnowstormConcept existingConceptView = fetchBrowserConcept(branch, conceptId);
    existingConceptView.definitionStatusId(
        mapFromDefinitionStatusToId(
            Objects.requireNonNull(existingConceptView.getDefinitionStatus())));

    productUpdateCreationDetails.getHistoricState().setConcept(existingConceptView);
    validateCoreConceptDescriptionsImmutable(
        existingConceptView,
        productDescriptionUpdateRequest,
        models.getModelConfiguration(branch).getPreferredLanguageRefsets());

    DescriptionUpdatePlan plan =
        buildDescriptionUpdatePlan(existingConceptView, productDescriptionUpdateRequest);

    productDescriptionUpdateRequest.setDescriptions(plan.targetDescriptions());

    SnowstormConcept conceptsNeedUpdate =
        prepareConceptUpdate(existingConceptView, productDescriptionUpdateRequest, branch);

    productUpdateCreationDetails.getUpdatedState().setConcept(conceptsNeedUpdate);

    boolean areDescriptionsModified =
        productDescriptionUpdateRequest.areDescriptionsModified(
            existingConceptView.getDescriptions());

    if (!areDescriptionsModified) {
      return productUpdateCreationDetails;
    }

    if (conceptsNeedUpdate != null) {
      try {
        log.info(
            String.format(
                "Product description update for %s initial description update commencing",
                conceptId));
        SnowstormConcept response =
            snowstormClient.updateConcept(
                branch, conceptsNeedUpdate.getConceptId(), conceptsNeedUpdate, false);
        log.info(
            String.format(
                "Product description update for %s initial description update completed",
                conceptId));
        productUpdateCreationDetails.getUpdatedState().setConcept(response);

        // A second update is only required when a genuinely new description had to be created (so
        // that its server-assigned id is known) before the released description it replaces can be
        // retired with a REPLACED_BY historical association. Reactivation-only edits are completed
        // in the first update because the reactivated description's id is known up front.
        if (!plan.postCreateRetirements().isEmpty()) {
          SnowstormConcept retireUpdate =
              applyPostCreateRetirements(
                  existingConceptView, response, plan.postCreateRetirements());
          log.info(
              String.format(
                  "Product description update for %s retire/replace description update commencing",
                  conceptId));
          SnowstormConcept response2 =
              snowstormClient.updateConcept(
                  branch, conceptsNeedUpdate.getConceptId(), retireUpdate, false);
          log.info(
              String.format(
                  "Product description update for %s retire/replace description update completed",
                  conceptId));
          productUpdateCreationDetails.getUpdatedState().setConcept(response2);
        }
      } catch (WebClientResponseException ex) {

        String errorBody = ex.getResponseBodyAsString();

        throw new ProductAtomicDataValidationProblem(String.format("%s", errorBody));
      }
    }

    return productUpdateCreationDetails;
  }

  private SnowstormConcept prepareConceptUpdate(
      SnowstormConcept existingConcept,
      ProductDescriptionUpdateRequest productDescriptionUpdateRequest,
      String branch) {
    if (productDescriptionUpdateRequest == null) return null;

    SnowstormConcept conceptNeedToUpdate = SnowstormDtoUtil.cloneConcept(existingConcept);

    String fsn =
        getFsnFromDescriptions(productDescriptionUpdateRequest.getDescriptions()).getTerm();
    String existingFsn =
        Objects.requireNonNull(
                existingConcept.getFsn(),
                "Concept " + existingConcept.getConceptId() + " has no FSN")
            .getTerm();

    if (fsn != null && existingFsn != null && !existingFsn.equals(fsn.trim())) {
      String newFsn = fsn.trim();

      snowstormClient.checkForDuplicateFsn(newFsn, branch);
    }

    // The target description set computed by buildDescriptionUpdatePlan already includes the
    // existing inactive descriptions that must be re-sent so Snowstorm does not delete them.
    conceptNeedToUpdate.setDescriptions(productDescriptionUpdateRequest.getDescriptions());

    return conceptNeedToUpdate;
  }

  /**
   * The set of descriptions to send to Snowstorm in the first update, plus any retirements that can
   * only be completed in a second update once a newly created replacement description has been
   * assigned an id.
   */
  private record DescriptionUpdatePlan(
      @NonNull Set<SnowstormDescription> targetDescriptions,
      @NonNull List<PostCreateRetirement> postCreateRetirements) {}

  /**
   * A released description that must be retired and pointed (REPLACED_BY) at a newly created one.
   */
  private record PostCreateRetirement(
      @NonNull SnowstormDescription oldReleasedDescription, @NonNull String replacementTermKey) {}

  /**
   * Identity for a description within a concept that participates in the SNOMED CT "no two
   * descriptions with the same term and language" constraints: term + language code + type.
   */
  private static String descriptionKey(SnowstormDescription description) {
    return description.getTerm()
        + "|"
        + description.getLanguageCode()
        + "|"
        + description.getTypeId();
  }

  /** The existing descriptions on the concept, indexed for building the update plan. */
  private record ExistingDescriptionIndex(
      @NonNull Map<String, SnowstormDescription> byId,
      @NonNull Map<String, SnowstormDescription> activeByKey,
      @NonNull Map<String, SnowstormDescription> inactiveByKey) {}

  /**
   * Computes the descriptions to send to Snowstorm for a description update.
   *
   * <p>When an edit introduces an active term that already exists as an <em>inactive</em>
   * description on the same concept, that inactive description is reactivated (reusing its id;
   * Snowstorm in turn reactivates its existing reference set members) rather than creating a
   * duplicate active description. When an edit collides with another <em>active</em> description
   * the update is rejected. Genuine new terms that replace a released description are created in
   * the first update and the released description is retired in a second update once the new id is
   * known.
   */
  private DescriptionUpdatePlan buildDescriptionUpdatePlan(
      SnowstormConcept existingConcept, ProductDescriptionUpdateRequest request) {

    List<SnowstormDescription> existingDescriptions =
        existingConcept.getDescriptions() == null
            ? List.of()
            : new ArrayList<>(existingConcept.getDescriptions());

    ExistingDescriptionIndex existing =
        new ExistingDescriptionIndex(
            existingDescriptions.stream()
                .filter(desc -> desc.getDescriptionId() != null)
                .collect(
                    Collectors.toMap(
                        SnowstormDescription::getDescriptionId, Function.identity(), (a, b) -> a)),
            existingDescriptions.stream()
                .filter(desc -> Boolean.TRUE.equals(desc.getActive()))
                .collect(
                    Collectors.toMap(
                        ProductUpdateService::descriptionKey, Function.identity(), (a, b) -> a)),
            existingDescriptions.stream()
                .filter(desc -> Boolean.FALSE.equals(desc.getActive()))
                .collect(
                    Collectors.toMap(
                        ProductUpdateService::descriptionKey, Function.identity(), (a, b) -> a)));

    Set<String> requestIds =
        request.getDescriptions().stream()
            .map(SnowstormDescription::getDescriptionId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

    Set<SnowstormDescription> target = new HashSet<>();
    Set<String> consumedInactiveIds = new HashSet<>();
    List<PostCreateRetirement> postCreateRetirements = new ArrayList<>();

    for (SnowstormDescription requested : request.getDescriptions()) {
      planRequestedDescription(
          requested, existing, target, consumedInactiveIds, postCreateRetirements);
    }

    reAddUntouchedInactiveDescriptions(
        existingDescriptions, requestIds, consumedInactiveIds, target);

    // A reactivated description is now active, so it must not also appear as an inactive row. The
    // UI
    // re-sends retired descriptions in the request to preserve them, so the description we just
    // reactivated can also be present inactive - sending the same id twice makes Snowstorm resolve
    // it to inactive and the term is lost. Drop the inactive duplicate of any reactivated id.
    target.removeIf(
        description ->
            Boolean.FALSE.equals(description.getActive())
                && description.getDescriptionId() != null
                && consumedInactiveIds.contains(description.getDescriptionId()));

    return new DescriptionUpdatePlan(target, postCreateRetirements);
  }

  /**
   * Decides how a single requested description contributes to the update, adding to {@code target}
   * (and {@code consumedInactiveIds} / {@code postCreateRetirements}) accordingly.
   */
  private void planRequestedDescription(
      SnowstormDescription requested,
      ExistingDescriptionIndex existing,
      Set<SnowstormDescription> target,
      Set<String> consumedInactiveIds,
      List<PostCreateRetirement> postCreateRetirements) {

    if (!Boolean.TRUE.equals(requested.getActive())) {
      // An inactive description sent explicitly by the caller is kept as-is.
      target.add(requested);
      return;
    }

    SnowstormDescription sameId =
        requested.getDescriptionId() == null
            ? null
            : existing.byId().get(requested.getDescriptionId());

    if (sameId != null && Objects.equals(sameId.getTerm(), requested.getTerm())) {
      // Term unchanged - acceptability or other mutable edit only; send as requested.
      target.add(requested);
      return;
    }

    String key = descriptionKey(requested);

    SnowstormDescription activeMatch = existing.activeByKey().get(key);
    if (activeMatch != null
        && !Objects.equals(activeMatch.getDescriptionId(), requested.getDescriptionId())) {
      throw new ProductAtomicDataValidationProblem(
          String.format(
              "Cannot use the term \"%s\" because an active description with the same term and"
                  + " language already exists on this concept.",
              requested.getTerm()));
    }

    SnowstormDescription inactiveMatch = existing.inactiveByKey().get(key);
    if (inactiveMatch != null) {
      // Reactivate the existing inactive description instead of creating a duplicate term.
      target.add(buildReactivatedDescription(inactiveMatch, requested));
      consumedInactiveIds.add(inactiveMatch.getDescriptionId());

      if (sameId != null
          && Boolean.TRUE.equals(sameId.getReleased())
          && !Objects.equals(sameId.getDescriptionId(), inactiveMatch.getDescriptionId())) {
        // Genuine rename of a released description: retire the old term, replaced by the
        // reactivated description (whose id is already known).
        target.add(retireDescription(sameId, inactiveMatch.getDescriptionId()));
      }
      // An unreleased description being renamed is simply dropped - Snowstorm deletes
      // descriptions that are not re-sent.
    } else if (sameId != null && Boolean.TRUE.equals(sameId.getReleased())) {
      // Rename of a released description with no inactive match: create the new description now and
      // retire the old one once its replacement id is known (second update).
      SnowstormDescription newDescription = SnowstormDtoUtil.cloneSnowstormDescription(requested);
      newDescription.setDescriptionId(null);
      newDescription.setReleased(false);
      newDescription.setActive(true);
      target.add(newDescription);
      target.add(SnowstormDtoUtil.cloneSnowstormDescription(sameId));
      postCreateRetirements.add(new PostCreateRetirement(sameId, key));
    } else {
      // Brand new description (no id) or an unreleased edit-in-place: send as requested.
      target.add(requested);
    }
  }

  /**
   * Re-sends existing inactive descriptions that were neither reactivated nor explicitly provided
   * so Snowstorm does not delete them. Their acceptability is blanked so we never re-assert active
   * language reference set members against an inactive description.
   */
  private void reAddUntouchedInactiveDescriptions(
      List<SnowstormDescription> existingDescriptions,
      Set<String> requestIds,
      Set<String> consumedInactiveIds,
      Set<SnowstormDescription> target) {

    for (SnowstormDescription inactive : existingDescriptions) {
      if (Boolean.FALSE.equals(inactive.getActive())
          && !consumedInactiveIds.contains(inactive.getDescriptionId())
          && !requestIds.contains(inactive.getDescriptionId())) {
        SnowstormDescription retained = SnowstormDtoUtil.cloneSnowstormDescription(inactive);
        retained.setAcceptabilityMap(new HashMap<>());
        target.add(retained);
      }
    }
  }

  /**
   * Builds a reactivated copy of an inactive description: active, with the requested acceptability,
   * and with the description-inactivation-indicator and historical-association reference set
   * members cleared. Snowstorm reactivates the existing language reference set members (reusing
   * their ids) and retires the indicator/association members based on these fields.
   */
  private static SnowstormDescription buildReactivatedDescription(
      SnowstormDescription inactiveDescription, SnowstormDescription requested) {
    SnowstormDescription reactivated =
        SnowstormDtoUtil.cloneSnowstormDescription(inactiveDescription);
    reactivated.setActive(true);
    reactivated.setInactivationIndicator(null);
    reactivated.setAssociationTargets(new HashMap<>());
    reactivated.setAcceptabilityMap(
        requested.getAcceptabilityMap() == null
            ? new HashMap<>()
            : new HashMap<>(requested.getAcceptabilityMap()));
    return reactivated;
  }

  /**
   * Builds a retired copy of a released description, pointed at its replacement via REPLACED_BY.
   */
  private static SnowstormDescription retireDescription(
      SnowstormDescription releasedDescription, String replacementDescriptionId) {
    SnowstormDescription retired = SnowstormDtoUtil.cloneSnowstormDescription(releasedDescription);
    retired.setActive(false);
    retired.setInactivationIndicator("OUTDATED");
    Map<String, Set<String>> associationTargets = new HashMap<>();
    associationTargets.put("REPLACED_BY", new HashSet<>(Set.of(replacementDescriptionId)));
    retired.setAssociationTargets(associationTargets);
    retired.setAcceptabilityMap(new HashMap<>());
    return retired;
  }

  /**
   * Completes retire/replace for genuinely new descriptions: locates each newly created replacement
   * (by term key, restricted to ids that did not exist before the first update) and retires the
   * released description it replaces with a REPLACED_BY association.
   */
  private SnowstormConcept applyPostCreateRetirements(
      SnowstormConcept existingConcept,
      SnowstormConcept response,
      List<PostCreateRetirement> postCreateRetirements) {

    Set<String> preExistingIds =
        existingConcept.getDescriptions() == null
            ? Set.of()
            : existingConcept.getDescriptions().stream()
                .map(SnowstormDescription::getDescriptionId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

    Map<String, SnowstormDescription> responseById =
        response.getDescriptions().stream()
            .filter(desc -> desc.getDescriptionId() != null)
            .collect(
                Collectors.toMap(
                    SnowstormDescription::getDescriptionId, Function.identity(), (a, b) -> a));

    Set<SnowstormDescription> finalDescriptions = new HashSet<>(response.getDescriptions());

    for (PostCreateRetirement retirement : postCreateRetirements) {
      SnowstormDescription createdReplacement =
          response.getDescriptions().stream()
              .filter(desc -> Boolean.TRUE.equals(desc.getActive()))
              .filter(desc -> retirement.replacementTermKey().equals(descriptionKey(desc)))
              .filter(
                  desc ->
                      desc.getDescriptionId() != null
                          && !preExistingIds.contains(desc.getDescriptionId()))
              .findFirst()
              .orElse(null);

      if (createdReplacement == null) {
        // The first update already committed, so the concept is half-updated (replacement created,
        // old description not yet retired). This is an internal invariant failure - not bad user
        // input - so surface it as a server error with enough context to debug the partial state.
        String message =
            String.format(
                "Retire/replace could not locate the newly created replacement for concept %s"
                    + " (replacement key '%s', original description %s). The initial update already"
                    + " committed, so the concept may be left partially updated. Candidate"
                    + " description ids: %s",
                response.getConceptId(),
                retirement.replacementTermKey(),
                retirement.oldReleasedDescription().getDescriptionId(),
                response.getDescriptions().stream()
                    .map(SnowstormDescription::getDescriptionId)
                    .toList());
        log.severe(message);
        throw new LingoProblem(
            "retire-replace-incomplete",
            "Retire/replace could not be completed",
            HttpStatus.INTERNAL_SERVER_ERROR,
            message);
      }

      SnowstormDescription oldInResponse =
          responseById.get(retirement.oldReleasedDescription().getDescriptionId());
      if (oldInResponse != null) {
        finalDescriptions.remove(oldInResponse);
      }
      finalDescriptions.add(
          retireDescription(
              retirement.oldReleasedDescription(), createdReplacement.getDescriptionId()));
    }

    response.setDescriptions(finalDescriptions);
    response.setDefinitionStatusId(
        mapFromDefinitionStatusToId(Objects.requireNonNull(response.getDefinitionStatus())));
    return response;
  }

  static void validateCoreConceptDescriptionsImmutable(
      SnowstormConcept existingConcept,
      ProductDescriptionUpdateRequest productDescriptionUpdateRequest,
      Set<String> preferredLanguageRefsets) {
    if (existingConcept == null
        || existingConcept.getDescriptions() == null
        || productDescriptionUpdateRequest == null
        || productDescriptionUpdateRequest.getDescriptions() == null
        || !SNOMED_CT_CORE_MODULE_ID.equals(existingConcept.getModuleId())) {
      return;
    }

    Map<String, SnowstormDescription> requestedDescriptionsById =
        productDescriptionUpdateRequest.getDescriptions().stream()
            .filter(description -> description.getDescriptionId() != null)
            .collect(
                Collectors.toMap(
                    SnowstormDescription::getDescriptionId,
                    Function.identity(),
                    (existing, replacement) -> replacement));

    existingConcept.getDescriptions().stream()
        .filter(description -> Boolean.TRUE.equals(description.getActive()))
        .forEach(
            existingDescription -> {
              SnowstormDescription requested =
                  requestedDescriptionsById.get(existingDescription.getDescriptionId());

              if ("FSN".equals(existingDescription.getType())) {
                if (requested == null) {
                  throw new ProductAtomicDataValidationProblem(CORE_FSN_MISSING_ERROR);
                }
                if (!Objects.equals(existingDescription.getTerm(), requested.getTerm())
                    || !Objects.equals(existingDescription.getActive(), requested.getActive())) {
                  throw new ProductAtomicDataValidationProblem(CORE_FSN_EDIT_ERROR);
                }
              } else if ("SYNONYM".equals(existingDescription.getType())
                  && requested != null
                  && existingDescription.getAcceptabilityMap() != null) {
                existingDescription
                    .getAcceptabilityMap()
                    .forEach(
                        (refsetId, acceptability) -> {
                          if (!preferredLanguageRefsets.contains(refsetId)) {
                            String requestedAcceptability =
                                requested.getAcceptabilityMap() != null
                                    ? requested.getAcceptabilityMap().get(refsetId)
                                    : null;
                            if (!Objects.equals(acceptability, requestedAcceptability)) {
                              throw new ProductAtomicDataValidationProblem(
                                  String.format(
                                      CORE_ACCEPTABILITY_EDIT_ERROR, preferredLanguageRefsets));
                            }
                          }
                        });
              }
            });
  }

  public SnowstormConcept fetchBrowserConcept(String branch, String conceptId) {
    return snowstormClient.getBrowserConcept(branch, conceptId).block();
  }

  public Collection<NonDefiningProperty> handleNonDefiningProperties(
      String branch, String conceptId, @Valid ProductPropertiesUpdateRequest updateRequest) {

    Map<String, NonDefiningPropertyDefinition> nonDefiningPropertiesByName =
        models.getModelConfiguration(branch).getNonDefiningPropertiesByName();

    Map<String, NonDefiningProperty> requestedProperties =
        updateRequest.getNewNonDefiningProperties().stream()
            .filter(prop -> nonDefiningPropertiesByName.containsKey(prop.getIdentifierScheme()))
            .map(p -> (NonDefiningProperty) p)
            .map(
                nonDefiningProperty -> {
                  NonDefiningPropertyDefinition def =
                      nonDefiningPropertiesByName.get(nonDefiningProperty.getIdentifierScheme());
                  nonDefiningProperty.setTitle(def.getTitle());
                  nonDefiningProperty.setDescription(def.getDescription());
                  nonDefiningProperty.setType(def.getPropertyType());
                  nonDefiningProperty.setIdentifier(def.getIdentifier());
                  return nonDefiningProperty;
                })
            .collect(
                Collectors.toMap(
                    prop ->
                        getNonDefiningPropertyKey(
                            nonDefiningPropertiesByName.get(prop.getIdentifierScheme()), prop),
                    prop -> prop));

    Set<String> definedTypeIds =
        nonDefiningPropertiesByName.values().stream()
            .map(NonDefiningPropertyDefinition::getIdentifier)
            .collect(Collectors.toSet());

    final SnowstormConcept browserConcept =
        snowstormClient.getBrowserConcepts(branch, Set.of(conceptId)).blockFirst();

    if (browserConcept == null) {
      throw new ProductAtomicDataValidationProblem(
          "Concept with ID " + conceptId + " does not exist in branch " + branch);
    }

    Map<String, SnowstormRelationship> existingProperties =
        browserConcept.getRelationships().stream()
            .filter(
                r ->
                    r.getActive() != null
                        && r.getActive()
                        && definedTypeIds.contains(r.getTypeId()))
            .collect(
                Collectors.toMap(
                    ProductUpdateService::getNonDefiningPropertyKeyForRelationship, r -> r));

    Set<SnowstormRelationship> idsToBeRemoved =
        existingProperties.entrySet().stream()
            .filter(entry -> !requestedProperties.containsKey(entry.getKey()))
            .map(Entry::getValue)
            .collect(Collectors.toSet());

    Set<SnowstormRelationship> idsToBeAdded =
        requestedProperties.entrySet().stream()
            .filter(entry -> !existingProperties.containsKey(entry.getKey()))
            .map(
                entry ->
                    NonDefiningPropertiesConverter.calculateNonDefiningRelationships(
                        entry.getValue(),
                        conceptId,
                        nonDefiningPropertiesByName.values(),
                        models.getModelConfiguration(branch).getModuleId()))
            .collect(Collectors.toSet());

    if (!idsToBeAdded.isEmpty() || !idsToBeRemoved.isEmpty()) {

      browserConcept.getRelationships().removeAll(idsToBeRemoved);
      browserConcept.getRelationships().addAll(idsToBeAdded);
      snowstormClient.updateConcept(branch, conceptId, browserConcept, false);
    }

    return requestedProperties.values();
  }

  private static <T extends ProductDetails> Class<T> getProductDetailsClass(
      PackageDetails<T> productDetails) {
    // Get the actual class of T using reflection on a concrete instance
    Class<T> productDetailsClass = null;
    if (!productDetails.getContainedProducts().isEmpty()) {
      @SuppressWarnings("unchecked")
      Class<T> cls =
          (Class<T>) productDetails.getContainedProducts().get(0).getProductDetails().getClass();
      productDetailsClass = cls;
    } else if (!productDetails.getContainedPackages().isEmpty()) {
      @SuppressWarnings("unchecked")
      Class<T> cls =
          (Class<T>)
              productDetails
                  .getContainedPackages()
                  .get(0)
                  .getPackageDetails()
                  .getContainedProducts()
                  .get(0)
                  .getProductDetails()
                  .getClass();
      productDetailsClass = cls;
    }

    if (productDetailsClass == null) {
      throw new IllegalArgumentException("Cannot determine product details class");
    }
    return productDetailsClass;
  }

  public <T extends ProductDetails> ValidationResult validateUpdateProductFromAtomicData(
      String branch, Long productId, @Valid PackageDetails<@Valid T> productDetails) {

    final Class<T> productDetailsClass = getProductDetailsClass(productDetails);

    // async call to calculate the product from atomic data
    final ProductCalculationService<T> calculationService =
        productCalculationServiceFactory.getCalculationService(productDetailsClass);

    ValidationResult result = calculationService.validateProductAtomicData(branch, productDetails);
    if (!snowstormClient.conceptExistsInReferenceSet(
        branch,
        productId.toString(),
        models
            .getModelConfiguration(branch)
            .getLeafBrandedPackageModelLevel()
            .getReferenceSetIdentifier())) {
      result.addProblem(
          "Product with ID "
              + productId
              + " does not exist in branch "
              + branch
              + ". Please create a new product instead of updating an existing one.");
    }

    return result;
  }

  public <T extends ProductDetails> ProductSummary calculateUpdateProductFromAtomicData(
      String branch, Long productId, @Valid PackageDetails<T> productDetails)
      throws ExecutionException, InterruptedException {

    final Class<T> productDetailsClass = getProductDetailsClass(productDetails);

    final ProductCalculationService<T> calculationService =
        productCalculationServiceFactory.getCalculationService(productDetailsClass);

    calculationService.validateProductAtomicData(branch, productDetails).throwIfInvalid();

    Mono<List<String>> taskChangedConceptIds = snowstormClient.getConceptIdsChangedOnTask(branch);

    Mono<List<String>> projectChangedConceptIds =
        snowstormClient.getConceptIdsChangedOnProject(branch);

    // async call to get product summary by productId
    CompletableFuture<ProductSummary> existingProductSummary =
        productSummaryService.getProductSummaryAsync(branch, productId.toString());

    CompletableFuture<ProductSummary> newProductSummary =
        calculationService.calculateProductFromAtomicDataAsync(branch, productDetails);

    CompletableFuture.allOf(existingProductSummary, newProductSummary).join();

    ProductSummary existingSummary = existingProductSummary.get();
    ProductSummary newSummary = newProductSummary.get();

    if (newSummary.getNodes().stream().anyMatch(n -> !n.getConceptOptions().isEmpty())) {
      log.info(
          "Updated state contains concept options, using the existing product summary to ensure correlation");
      Set<String> knownIds =
          existingSummary.getNodes().stream()
              .filter(n -> !n.isNewConcept())
              .map(Node::getConceptId)
              .collect(Collectors.toSet());

      productDetails.setSelectedConceptIdentifiers(knownIds);

      newSummary =
          calculationService.calculateProductFromAtomicDataAsync(branch, productDetails).get();
    }

    // correlate the existing product summary nodes to the new product summary nodes
    Map<String, Node> existingNodesByConceptId =
        existingSummary.getNodes().stream()
            .collect(Collectors.toMap(Node::getConceptId, Function.identity()));

    Set<String> allocatedExistingNodes = new HashSet<>();

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);
    final Set<@Valid Node> newNodes = newSummary.getNodesConnectedToSubject();
    newNodes.add(newSummary.getSingleSubject());

    newNodes.stream()
        .filter(
            node ->
                !node.isNewConcept() && existingNodesByConceptId.containsKey(node.getConceptId()))
        .forEach(
            node -> {
              allocatedExistingNodes.add(node.getConceptId());
            });

    // the subject of the new summary is the same as the subject of the old summary by definition
    newSummary
        .getSingleSubject()
        .setOriginalNode(
            OriginalNode.of(
                existingSummary.getSingleSubject(), null, false, modelConfiguration.getModuleId()));
    // Mark BOTH the new subject id and the existing subject id as allocated. The new subject's
    // id is added for the unchanged-subject case (concept matches existing → same id); the
    // existing subject's id is added for the changed-subject case (new SCTID replacing the
    // existing one → must not leak the existing CTPP into unmatchedPreviouslyReferencedNodes).
    allocatedExistingNodes.add(newSummary.getSingleSubject().getConceptId());
    allocatedExistingNodes.add(existingSummary.getSingleSubject().getConceptId());

    // for all the new nodes in the new summary, find the corresponding existing node
    newNodes.stream()
        .filter(
            node ->
                node.isNewConcept()
                    || node.getOriginalNode() == null
                    || !existingNodesByConceptId.containsKey(node.getOriginalNode().getConceptId()))
        .forEach(
            newNode -> {
              final Node bestMatchingNode =
                  getBestMatchingNode(newNode, existingNodesByConceptId, allocatedExistingNodes);
              if (bestMatchingNode != null) {
                newNode.setOriginalNode(
                    OriginalNode.of(
                        bestMatchingNode, null, true, modelConfiguration.getModuleId()));
                allocatedExistingNodes.add(bestMatchingNode.getConceptId());
              }
            });

    // include in the product summary all the unmatched existing nodes
    final ProductSummary finalNewSummary = newSummary;
    existingNodesByConceptId.values().stream()
        .filter(node -> !allocatedExistingNodes.contains(node.getConceptId()))
        .forEach(
            node ->
                finalNewSummary
                    .getUnmatchedPreviouslyReferencedNodes()
                    .add(OriginalNode.of(node, null, true, modelConfiguration.getModuleId())));

    // update all the existing nodes to indicate if they are referenced by other concepts outside
    // the ones in the summary
    Set<String> replacedConceptIds =
        newNodes.stream()
            .filter(
                node ->
                    node.getOriginalNode() != null
                        && !node.getConceptId()
                            .equals(node.getOriginalNode().getNode().getConceptId()))
            .map(node -> node.getOriginalNode().getNode().getConceptId())
            .collect(Collectors.toSet());
    replacedConceptIds.addAll(
        newSummary.getUnmatchedPreviouslyReferencedNodes().stream()
            .map(on -> on.getNode().getConceptId())
            .collect(Collectors.toSet()));

    Map<String, OriginalNode> originalNodes =
        new HashMap<>(
            newSummary.getUnmatchedPreviouslyReferencedNodes().stream()
                .collect(Collectors.toMap(OriginalNode::getConceptId, Function.identity())));
    originalNodes.putAll(
        newNodes.stream()
            .map(Node::getOriginalNode)
            .filter(Objects::nonNull)
            .collect(Collectors.toMap(on -> on.getNode().getConceptId(), Function.identity())));

    List<String> taskChangedIds = taskChangedConceptIds.block();
    List<String> projectChangedIds = projectChangedConceptIds.block();

    newNodes.forEach(
        node -> {
          node.setNewInTask(
              taskChangedIds != null
                  && (node.getConceptId().startsWith("-")
                      || taskChangedIds.contains(node.getConceptId())));
          node.setNewInProject(
              projectChangedIds != null && projectChangedIds.contains(node.getConceptId()));
          if (node.getOriginalNode() != null && node.getOriginalNode().getNode() != null) {
            node.getOriginalNode()
                .getNode()
                .setNewInTask(
                    taskChangedIds != null
                        && taskChangedIds.contains(node.getOriginalNode().getConceptId()));
            node.getOriginalNode()
                .getNode()
                .setNewInProject(
                    projectChangedIds != null
                        && projectChangedIds.contains(node.getOriginalNode().getConceptId()));
          }
        });

    List<CompletableFuture<Void>> referencedByOtherProductsFutures = new ArrayList<>();
    Set<String> referenceSets = modelConfiguration.getAllLevelReferenceSetIds();

    newNodes.stream()
        .filter(node -> node.getOriginalNode() != null)
        .forEach(
            newNode -> {
              OriginalNode originalNode = newNode.getOriginalNode();
              String originalConceptId = originalNode.getNode().getConceptId();
              referencedByOtherProductsFutures.add(
                  snowstormClient
                      .getConceptIdsFromEclAsync(
                          branch,
                          "((<"
                              + originalConceptId
                              + ") or (*:*="
                              + originalConceptId
                              + ")) AND ("
                              + referenceSets.stream()
                                  .map(s -> "^" + s)
                                  .collect(Collectors.joining(" OR "))
                              + ")",
                          0,
                          10000,
                          modelConfiguration.isExecuteEclAsStated())
                      .thenAccept(
                          c -> {
                            final boolean referencedByOtherProducts =
                                !replacedConceptIds.containsAll(c);

                            originalNode.setReferencedByOtherProducts(referencedByOtherProducts);

                            if (referencedByOtherProducts || originalNode.isExternalConcept()) {
                              // if the original node is referenced by other products or owned by
                              // an external module, it should not be retired or edited in place
                              originalNode.setInactivationReason(null);
                            } else if (!newNode.isNewInTask() && !newNode.isNewInProject()) {
                              // if the node is not new in task or project, the original node should
                              // be retired
                              originalNode.setInactivationReason(InactivationReason.ERRONEOUS);
                            } else if (originalNode.getNode().isNewInTask()
                                || originalNode.getNode().isNewInProject()) {
                              // if the original node is new it should be edited
                              originalNode.setInactivationReason(null);
                            } else {
                              originalNode.setInactivationReason(InactivationReason.ERRONEOUS);
                            }
                          }));
            });

    CompletableFuture.allOf(referencedByOtherProductsFutures.toArray(new CompletableFuture[0]))
        .join();

    markDependentNodesAsReferenced(originalNodes, existingProductSummary.get().getEdges());

    return newSummary;
  }

  /**
   * Propagates reference status to dependent nodes in a directed graph.
   *
   * <p>This method iterates through nodes in dependency order (from least to most dependent) and
   * updates their reference status based on their dependencies. If a node is referenced by other
   * products, any nodes that depend on it (through directed edges) will also be marked as
   * referenced by other products.
   *
   * <p>The nodes are sorted to ensure proper propagation: 1. Nodes referenced by other nodes appear
   * before nodes that reference them 2. When no direct reference exists, nodes with fewer incoming
   * edges appear first 3. For nodes with equal incoming edges, sorting is by conceptId for
   * deterministic results
   *
   * @param originalNodes Map of concept IDs to their node representations
   * @param edges Set of directed edges connecting the nodes
   */
  private void markDependentNodesAsReferenced(
      Map<String, OriginalNode> originalNodes, @NotNull @NotEmpty Set<@Valid Edge> edges) {

    List<OriginalNode> sortedOriginalNodes =
        originalNodes.values().stream()
            .sorted(
                (node1, node2) -> {
                  String id1 = node1.getConceptId();
                  String id2 = node2.getConceptId();

                  // Check references
                  boolean node1ReferencesNode2 =
                      edges.stream()
                          .anyMatch(e -> e.getSource().equals(id1) && e.getTarget().equals(id2));
                  boolean node2ReferencesNode1 =
                      edges.stream()
                          .anyMatch(e -> e.getSource().equals(id2) && e.getTarget().equals(id1));

                  if (node1ReferencesNode2 && node2ReferencesNode1) {
                    throw new IllegalStateException(
                        "Circular reference detected between nodes: " + id1 + " and " + id2);
                  }

                  if (node1ReferencesNode2 && !node2ReferencesNode1) {
                    return 1;
                  }
                  if (node2ReferencesNode1 && !node1ReferencesNode2) {
                    return -1;
                  }

                  // Compare by incoming edges
                  long incomingCount1 =
                      edges.stream().filter(e -> e.getTarget().equals(id1)).count();
                  long incomingCount2 =
                      edges.stream().filter(e -> e.getTarget().equals(id2)).count();

                  if (incomingCount1 != incomingCount2) {
                    return Long.compare(incomingCount1, incomingCount2);
                  }

                  // Sort by conceptId as final tie-breaker
                  return id1.compareTo(id2);
                })
            .toList();

    for (OriginalNode originalNode : sortedOriginalNodes) {
      if (!originalNode.isReferencedByOtherProducts()
          && edges.stream()
              .anyMatch(
                  e ->
                      e.getTarget().equals(originalNode.getConceptId())
                          && originalNodes.get(e.getSource()).isReferencedByOtherProducts())) {

        originalNode.setReferencedByOtherProducts(true);
      }
    }
  }

  /**
   * Finds the best matching existing node for the specified new node from existingNodesByConceptId
   * discounting any nodes that have already been allocated to other new nodes in
   * allocatedExistingNodes. Matches are based on best fully specified name match and limited to
   * nodes of the same ModelLevelType.
   */
  private Node getBestMatchingNode(
      @Valid Node newNode,
      Map<String, Node> existingNodesByConceptId,
      Set<String> allocatedExistingNodes) {
    return existingNodesByConceptId.values().stream()
        .filter(node -> !allocatedExistingNodes.contains(node.getConceptId()))
        .filter(node -> node.getModelLevel().equals(newNode.getModelLevel()))
        .filter(
            node ->
                StringUtils.hasText(node.getFullySpecifiedName())
                    && StringUtils.hasText(newNode.getFullySpecifiedName()))
        .min(
            (a, b) ->
                Double.compare(
                    calculateLevenshteinDistance(
                        a.getFullySpecifiedName(), newNode.getFullySpecifiedName()),
                    calculateLevenshteinDistance(
                        b.getFullySpecifiedName(), newNode.getFullySpecifiedName())))
        .orElse(null);
  }

  private double calculateLevenshteinDistance(String str1, String str2) {
    int[][] dp = new int[str1.length() + 1][str2.length() + 1];

    for (int i = 0; i <= str1.length(); i++) {
      dp[i][0] = i;
    }

    for (int j = 0; j <= str2.length(); j++) {
      dp[0][j] = j;
    }

    for (int i = 1; i <= str1.length(); i++) {
      for (int j = 1; j <= str2.length(); j++) {
        if (str1.charAt(i - 1) == str2.charAt(j - 1)) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
        }
      }
    }

    return dp[str1.length()][str2.length()] / (double) Math.max(str1.length(), str2.length());
  }

  private String mapFromDefinitionStatusToId(String definitionStatus) {
    if (definitionStatus.equals("PRIMITIVE")) {
      return "900000000000074008";
    }
    if (definitionStatus.equals("FULLY_DEFINED")) {
      return "900000000000073002";
    }
    return null;
  }
}
