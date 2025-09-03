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

import static au.gov.digitalhealth.lingo.util.NonDefiningPropertiesConverter.calculateNonDefiningRelationships;
import static au.gov.digitalhealth.lingo.util.ReferenceSetUtils.calculateReferenceSetMembers;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.*;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.*;
import static java.lang.Boolean.TRUE;

import au.csiro.snowstorm_client.model.*;
import au.gov.digitalhealth.lingo.configuration.ExternalReferenceToBlobStorage;
import au.gov.digitalhealth.lingo.configuration.FieldBindingConfiguration;
import au.gov.digitalhealth.lingo.configuration.NamespaceConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.BasePropertyDefinition;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.exception.EmptyProductCreationProblem;
import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.exception.NamespaceNotConfiguredProblem;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.lingo.product.Edge;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.PrimitiveConceptCreationRequest;
import au.gov.digitalhealth.lingo.product.ProductCreateUpdateDetails;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.bulk.BrandPackSizeCreationDetails;
import au.gov.digitalhealth.lingo.product.bulk.BulkProductAction;
import au.gov.digitalhealth.lingo.product.details.ProductDetails;
import au.gov.digitalhealth.lingo.service.identifier.IdentifierSource;
import au.gov.digitalhealth.lingo.util.NonDefiningPropertiesConverter;
import au.gov.digitalhealth.lingo.util.OwlAxiomService;
import au.gov.digitalhealth.lingo.util.ReferenceSetUtils;
import au.gov.digitalhealth.lingo.util.SnomedConstants;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import au.gov.digitalhealth.tickets.TicketDto;
import au.gov.digitalhealth.tickets.TicketDtoExtended;
import au.gov.digitalhealth.tickets.controllers.BulkProductActionDto;
import au.gov.digitalhealth.tickets.controllers.ProductDto;
import au.gov.digitalhealth.tickets.service.ModifiedGeneratedNameService;
import au.gov.digitalhealth.tickets.service.TicketServiceImpl;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Level;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.apache.commons.collections4.BidiMap;
import org.apache.commons.collections4.bidimap.DualHashBidiMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Log
@Service
public class ProductCreationService {

  private final BlobStorageService blobStorageService;
  SnowstormClient snowstormClient;
  NameGenerationService nameGenerationService;
  TicketServiceImpl ticketService;
  OwlAxiomService owlAxiomService;
  ObjectMapper objectMapper;
  IdentifierSource identifierSource;
  NamespaceConfiguration namespaceConfiguration;

  ModifiedGeneratedNameService modifiedGeneratedNameService;
  FieldBindingConfiguration fieldBindingConfiguration;
  Models models;

  ExternalReferenceToBlobStorage externalReferenceToBlobStorage;

  public ProductCreationService(
      SnowstormClient snowstormClient,
      NameGenerationService nameGenerationService,
      TicketServiceImpl ticketService,
      OwlAxiomService owlAxiomService,
      ObjectMapper objectMapper,
      IdentifierSource identifierSource,
      NamespaceConfiguration namespaceConfiguration,
      ModifiedGeneratedNameService modifiedGeneratedNameService,
      FieldBindingConfiguration fieldBindingConfiguration,
      Models models,
      ExternalReferenceToBlobStorage externalReferenceToBlobStorage,
      BlobStorageService blobStorageService) {
    this.snowstormClient = snowstormClient;
    this.nameGenerationService = nameGenerationService;
    this.ticketService = ticketService;
    this.owlAxiomService = owlAxiomService;
    this.objectMapper = objectMapper;
    this.identifierSource = identifierSource;
    this.namespaceConfiguration = namespaceConfiguration;
    this.modifiedGeneratedNameService = modifiedGeneratedNameService;
    this.fieldBindingConfiguration = fieldBindingConfiguration;
    this.models = models;
    this.externalReferenceToBlobStorage = externalReferenceToBlobStorage;
    this.blobStorageService = blobStorageService;
  }

  private static void updateAxiomIdentifierReferences(
      Map<String, String> idMap, SnowstormConceptView concept) {
    // if the concept references a concept that has just been created, update the destination
    // from the placeholder negative number to the new SCTID
    getActiveClassAxioms(concept)
        .forEach(
            a ->
                a.getRelationships()
                    .forEach(
                        r -> {
                          if (idMap.containsKey(r.getDestinationId())) {
                            r.setDestinationId(idMap.get(r.getDestinationId()));
                          }
                        }));
  }

  private static void assertNoRemainingReferencesToPlaceholderDestinationIds(
      List<Node> nodeCreateOrder, Map<String, String> idMap, List<SnowstormConceptView> concepts) {
    if (concepts.stream()
        .map(SnowstormConceptView::getConceptId)
        .anyMatch(id -> id != null && Long.parseLong(id) < 0)) {
      throw new LingoProblem(
          "product-creation",
          "All negative identifiers should have been replaced",
          HttpStatus.INTERNAL_SERVER_ERROR);
    } else if (concepts.stream()
        .flatMap(c -> getActiveClassAxioms(c).stream().flatMap(a -> a.getRelationships().stream()))
        .anyMatch(
            r ->
                r.getConcreteValue() == null
                    && Long.parseLong(Objects.requireNonNull(r.getDestinationId())) < 0)) {

      List<SnowstormConceptView> offendingConcepts =
          concepts.stream()
              .filter(
                  c ->
                      getActiveClassAxioms(c).stream()
                          .anyMatch(
                              a ->
                                  a.getRelationships().stream()
                                      .anyMatch(
                                          r ->
                                              r.getConcreteValue() == null
                                                  && Long.parseLong(
                                                          Objects.requireNonNull(
                                                              r.getDestinationId()))
                                                      < 0)))
              .toList();

      log.severe(
          "Identifier references should have been replaced with allocated identifiers. Node create order "
              + nodeCreateOrder.stream().map(Node::getConceptId).collect(Collectors.joining(", "))
              + ". Offending concepts: "
              + offendingConcepts
              + " Id map: "
              + idMap);

      throw new LingoProblem(
          "product-creation",
          "Identifier references should have been replaced with allocated identifiers",
          HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private static void validateCreateOperation(ProductSummary productSummary) {
    if (productSummary.getNodes().stream().anyMatch(Node::isConceptEdit)) {
      throw new ProductAtomicDataValidationProblem(
          "Cannot edit existing concepts as part of a create operation");
    }

    if (productSummary.getNodes().stream()
        .anyMatch(node -> node.isRetireAndReplace() || node.isRetireAndReplaceWithExisting())) {
      throw new ProductAtomicDataValidationProblem(
          "Cannot retire and replace concepts as part of a create operation");
    }
  }

  private static void validateUpdateOperation(ProductSummary productSummary) {
    if (productSummary.getNodes().stream()
        .anyMatch(
            node ->
                node.getConcept() != null
                    && node.getNewConceptDetails() == null
                    && node.getOriginalNode() != null
                    && node.getConcept().getConceptId() != null
                    && !node.getConcept()
                        .getConceptId()
                        .equals(node.getOriginalNode().getConceptId())
                    && node.getOriginalNode().getInactivationReason() == null)) {

      String offendingConcepts =
          productSummary.getNodes().stream()
              .filter(
                  node ->
                      node.getConcept() != null
                          && node.getNewConceptDetails() == null
                          && node.getOriginalNode() != null
                          && node.getConcept().getConceptId() != null
                          && !node.getConcept()
                              .getConceptId()
                              .equals(node.getOriginalNode().getConceptId())
                          && node.getOriginalNode().getInactivationReason() == null)
              .map(Node::getFullySpecifiedName)
              .collect(Collectors.joining(", "));

      throw new ProductAtomicDataValidationProblem(
          "Cannot edit existing concept identified as the replacement with no defining changes "
              + "required - retire and replace must be chosen instead. Offending concepts: "
              + offendingConcepts);
    }
  }

  private static void logCreationOrder(List<Node> nodeCreateOrder) {
    if (log.isLoggable(Level.FINE)) {
      log.fine(
          "Creating concepts in order "
              + nodeCreateOrder.stream()
                  .map(n -> n.getConceptId() + "_" + n.getLabel())
                  .collect(Collectors.joining(", ")));
      nodeCreateOrder.stream()
          .filter(n -> n.getNewConceptDetails() != null)
          .forEach(
              n ->
                  n.getNewConceptDetails().getAxioms().stream()
                      .flatMap(a -> a.getRelationships().stream())
                      .filter(
                          r ->
                              r.getConcreteValue() == null
                                  && r.getDestinationId() != null
                                  && Long.parseLong(r.getDestinationId()) < 0)
                      .forEach(
                          r ->
                              log.fine(
                                  "Relationship "
                                      + n.getConceptId()
                                      + " -> "
                                      + r.getDestinationId())));
    }
  }

  private static boolean updateConceptNonDefiningRelationships(
      Set<SnowstormRelationship> existingRelationships,
      Set<SnowstormRelationship> newRelationships) {
    // Remove any existing relationships that are not in the new relationships
    boolean relationshipsRemoved =
        existingRelationships.removeIf(
            existingRelationship ->
                ADDITIONAL_RELATIONSHIP
                        .getValue()
                        .equals(existingRelationship.getCharacteristicType())
                    && newRelationships.stream()
                        .noneMatch(
                            newRelationship ->
                                isTypeAndDestinationMatch(existingRelationship, newRelationship)));

    AtomicBoolean relationshipsAdded = new AtomicBoolean(false);
    // Add the new relationships
    newRelationships.forEach(
        newRelationship -> {
          if (existingRelationships.stream()
              .noneMatch(
                  existingRelationship ->
                      isTypeAndDestinationMatch(existingRelationship, newRelationship))) {
            existingRelationships.add(newRelationship);
            relationshipsAdded.set(true);
          }
        });
    return relationshipsAdded.get() || relationshipsRemoved;
  }

  private static boolean isTypeAndDestinationMatch(
      SnowstormRelationship existingRelationship, SnowstormRelationship newRelationship) {
    return existingRelationship.getTypeId().equals(newRelationship.getTypeId())
        && ((newRelationship.getDestinationId() != null
                && existingRelationship.getDestinationId() != null
                && existingRelationship
                    .getDestinationId()
                    .equals(newRelationship.getDestinationId()))
            || (newRelationship.getConcreteValue() != null
                && existingRelationship.getConcreteValue() != null
                && existingRelationship
                    .getConcreteValue()
                    .equals(newRelationship.getConcreteValue())));
  }

  private static boolean isMatchingRefsetTypeAndAdditionalProperties(
      SnowstormReferenceSetMember existingMember,
      SnowstormReferenceSetMemberViewComponent newMember) {
    final boolean bothNullOrEmpty =
        (newMember.getAdditionalFields() == null || newMember.getAdditionalFields().isEmpty())
            && (existingMember.getAdditionalFields() == null
                || existingMember.getAdditionalFields().isEmpty());
    return newMember.getRefsetId() != null
        && newMember.getRefsetId().equals(existingMember.getRefsetId())
        && (bothNullOrEmpty
            || Objects.equals(
                newMember.getAdditionalFields(), existingMember.getAdditionalFields()));
  }

  /**
   * Creates a product from the provided BrandPackSizeCreationDetails
   *
   * @param branch to write the changes to
   * @param creationDetails the details for creating the product
   * @throws InterruptedException if the operation is interrupted
   */
  public ProductSummary createProductFromBrandPackSizeCreationDetails(
      String branch, @Valid BulkProductAction<BrandPackSizeCreationDetails> creationDetails)
      throws InterruptedException {

    snowstormClient.throwIfBranchLocked(branch);

    // validate the ticket exists
    TicketDtoExtended ticket = ticketService.findTicket(creationDetails.getTicketId());

    ProductSummary productSummary = creationDetails.getProductSummary();
    if (productSummary.getNodes().stream().noneMatch(Node::isNewConcept)) {
      throw new EmptyProductCreationProblem();
    }

    ProductSummary productSummaryClone = null;
    try {
      productSummaryClone =
          objectMapper.readValue(
              objectMapper.writeValueAsString(productSummary), ProductSummary.class);
    } catch (JsonProcessingException jsonProcessingException) {
      log.severe("Could not clone product summary - potentially missed ModifiedGeneratedNames");
    }

    Set<Node> newSubjects =
        productSummary.calculateSubject(false, models.getModelConfiguration(branch)).stream()
            .filter(Node::isNewConcept)
            .collect(Collectors.toSet());

    BidiMap<String, String> idMap = createAndUpdate(branch, productSummary, true);

    if (productSummaryClone != null) {
      modifiedGeneratedNameService.createAndSaveModifiedGeneratedNames(
          productSummaryClone, branch, idMap);
    }

    BulkProductActionDto dto =
        BulkProductActionDto.builder()
            .conceptIds(newSubjects.stream().map(Node::getConceptId).collect(Collectors.toSet()))
            .details(creationDetails.getDetails())
            .build();

    dto.setName(ticketService.getNewBulkProductActionName(ticket.getId(), dto));
    creationDetails.setPartialSaveName(dto.getName());

    updateTicket(creationDetails, ticket, dto);
    return productSummary;
  }

  /**
   * Updates the product concepts in the ProductSummary that are new or updated concepts and returns
   * an updated ProductSummary with the new and updated concepts.
   *
   * @param branch branch to write the changes to
   * @param productCreationDetails ProductCreationDetails containing the concepts to create and
   *     update
   * @return ProductSummary with the new and updated concepts
   */
  public ProductSummary updateProductFromAtomicData(
      String branch,
      @Valid ProductCreateUpdateDetails<? extends ProductDetails> productCreationDetails)
      throws InterruptedException {
    return createUpdateProductFromAtomicData(branch, productCreationDetails, false);
  }

  /**
   * Creates the product concepts in the ProductSummary that are new concepts and returns an updated
   * ProductSummary with the new concepts.
   *
   * @param branch branch to write the changes to
   * @param productCreationDetails ProductCreationDetails containing the concepts to create and
   *     update
   * @return ProductSummary with the new and updated concepts
   */
  public ProductSummary createUpdateProductFromAtomicData(
      String branch,
      @Valid ProductCreateUpdateDetails<? extends ProductDetails> productCreationDetails)
      throws InterruptedException {
    return createUpdateProductFromAtomicData(branch, productCreationDetails, true);
  }

  private ProductSummary createUpdateProductFromAtomicData(
      String branch,
      @Valid ProductCreateUpdateDetails<? extends ProductDetails> productCreationDetails,
      boolean createOnly)
      throws InterruptedException {

    snowstormClient.throwIfBranchLocked(branch);

    // validate the ticket exists
    TicketDtoExtended ticket = ticketService.findTicket(productCreationDetails.getTicketId());

    ProductSummary productSummary = productCreationDetails.getProductSummary();
    ProductSummary productSummaryClone = null;
    try {
      productSummaryClone =
          objectMapper.readValue(
              objectMapper.writeValueAsString(productSummary), ProductSummary.class);
    } catch (JsonProcessingException jsonProcessingException) {
      log.severe("Could not clone product summary - potentially missed ModifiedGeneratedNames");
    }

    BidiMap<String, String> idMap = createAndUpdate(branch, productSummary, createOnly);

    if (productSummaryClone != null) {
      modifiedGeneratedNameService.createAndSaveModifiedGeneratedNames(
          productSummaryClone, branch, idMap);
    }

    updateTicket(
        ticket, productCreationDetails.toProductDto(), productCreationDetails.getPartialSaveName());
    return productSummary;
  }

  public SnowstormConceptMini createPrimitiveConcept(
      String branch, @Valid PrimitiveConceptCreationRequest brandCreationRequest) {

    snowstormClient.throwIfBranchLocked(branch);

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    // Validate that the ticket exists
    ticketService.findTicket(brandCreationRequest.getTicketId());

    // Generate the fully specified name (FSN) for the brand
    String semanticTag = brandCreationRequest.getSemanticTag();

    String generatePT = generatePT(brandCreationRequest.getConceptName().trim(), semanticTag);
    String generatedFsn = String.format("%s %s", generatePT, semanticTag);

    SnowstormConceptView createdConcept =
        createPrimitiveConcept(
            branch,
            generatedFsn,
            generatePT,
            Set.of(
                getSnowstormRelationship(
                    IS_A,
                    brandCreationRequest.getParentConceptId(),
                    brandCreationRequest.getParentConceptName(),
                    0,
                    modelConfiguration.getModuleId())));

    return toSnowstormConceptMini(createdConcept);
  }

  /**
   * Generates a modified version of the preferred name by potentially removing the specified
   * semantic tag from its end.
   *
   * <p>This method checks if the given name ends with the provided semantic tag. If it does, the
   * method removes the last occurrence of the semantic tag from the name before returning the
   * modified name. If the name does not end with the semantic tag, it remains unchanged.
   *
   * @param name The name to be processed, which may contain the semantic tag.
   * @param semanticTag The semantic tag to check for at the end of the name.
   * @return The modified name with the semantic tag removed if it was present at the end;
   *     otherwise, returns the original name unchanged.
   */
  private String generatePT(String name, String semanticTag) {
    if (name.endsWith(semanticTag)) {
      int lastIndex = name.lastIndexOf(semanticTag);
      name = name.substring(0, lastIndex) + name.substring(lastIndex + semanticTag.length());
    }
    return name.trim();
  }

  private SnowstormConceptView createPrimitiveConcept(
      String branch, String fsn, String pt, Set<SnowstormRelationship> relationships) {
    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    snowstormClient.checkForDuplicateFsn(fsn, branch);
    // Create and configure the new Snowstorm concept
    SnowstormConceptView newConcept = new SnowstormConceptView();
    newConcept.setActive(true);
    newConcept.setDefinitionStatusId(PRIMITIVE.getValue());
    newConcept.setModuleId(modelConfiguration.getModuleId());

    // Add descriptions to the concept (synonym and fully specified name)
    SnowstormDtoUtil.addDescription(
        newConcept,
        pt,
        SnomedConstants.SYNONYM.getValue(),
        modelConfiguration,
        // todo need to revise hard coding case sensitivity
        ENTIRE_TERM_CASE_SENSITIVE.getValue());
    SnowstormDtoUtil.addDescription(
        newConcept,
        fsn,
        SnomedConstants.FSN.getValue(),
        modelConfiguration,
        ENTIRE_TERM_CASE_SENSITIVE.getValue());

    // Add the axiom to the concept
    SnowstormAxiom axiom = createPrimitiveAxiom(relationships, modelConfiguration.getModuleId());
    newConcept.setClassAxioms(Set.of(axiom));

    // Create the concept in Snowstorm and return the result
    return snowstormClient.createConcept(branch, newConcept, false);
  }

  private SnowstormAxiom createPrimitiveAxiom(
      Set<SnowstormRelationship> relationships, @NotEmpty String moduleId) {
    SnowstormAxiom axiom = new SnowstormAxiom();
    axiom.active(true);
    axiom.setModuleId(moduleId);
    axiom.setDefinitionStatusId(PRIMITIVE.getValue());
    axiom.setDefinitionStatus("PRIMITIVE");
    axiom.setRelationships(relationships);
    axiom.setReleased(false);
    return axiom;
  }

  private BidiMap<String, String> createAndUpdate(
      String branch, ProductSummary productSummary, boolean createOnly)
      throws InterruptedException {

    if (createOnly) {
      if (productSummary.getNodes().stream().noneMatch(Node::isNewConcept)) {
        throw new EmptyProductCreationProblem();
      }
      validateCreateOperation(productSummary);
    } else {
      if (productSummary.getNodes().stream().noneMatch(Node::isNewConcept)
          && productSummary.getNodes().stream().noneMatch(Node::isConceptEdit)
          && productSummary.getNodes().stream().noneMatch(Node::isRetireAndReplace)
          && productSummary.getNodes().stream().noneMatch(Node::isRetireAndReplaceWithExisting)
          && productSummary.getNodes().stream().noneMatch(Node::isPropertyUpdate)) {
        throw new EmptyProductCreationProblem();
      }
      validateUpdateOperation(productSummary);
    }

    final ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    // validation done - update URL based non-defining properties
    blobStorageService.updateNonDefiningUrlProperties(modelConfiguration, productSummary);

    Mono<List<String>> taskChangedConceptIds = snowstormClient.getConceptIdsChangedOnTask(branch);

    Mono<List<String>> projectChangedConceptIds =
        snowstormClient.getConceptIdsChangedOnProject(branch);

    // tidy up selections
    // remove any concept options - should all be empty in the response from this method
    // if a concept is selected, removed new concept section
    productSummary
        .getNodes()
        .forEach(
            node -> {
              if (node.getConceptOptions() != null) {
                node.getConceptOptions().clear();
              }
              if (node.getConcept() != null) {
                node.setNewConceptDetails(null);
              }
            });

    updateConceptsWithPropertyOnlyChanges(branch, modelConfiguration, productSummary);

    List<Node> nodeCreateOrder =
        productSummary.getNodes().stream()
            .filter(
                node ->
                    node.isConceptEdit()
                        || node.isNewConcept()
                        || node.isRetireAndReplace()
                        || node.isRetireAndReplaceWithExisting())
            .sorted(Node.getNewNodeComparator(productSummary.getNodes()))
            .toList();

    // Force Snowstorm to work from the ids rather than the SnowstormConceptMini objects
    // which were added for diagramming
    nodeCreateOrder.stream()
        .filter(n -> n.getNewConceptDetails() != null)
        .forEach(
            n ->
                n.getNewConceptDetails()
                    .getAxioms()
                    .forEach(
                        a ->
                            a.getRelationships()
                                .forEach(
                                    r -> {
                                      r.setTarget(null);
                                      r.setType(null);
                                    })));

    logCreationOrder(nodeCreateOrder);

    BidiMap<String, String> idMap = new DualHashBidiMap<>();

    createOrUpdateConcepts(branch, nodeCreateOrder, idMap, createOnly);

    for (Edge edge : productSummary.getEdges()) {
      if (idMap.containsKey(edge.getSource())) {
        edge.setSource(idMap.get(edge.getSource()));
      }
      if (idMap.containsKey(edge.getTarget())) {
        edge.setTarget(idMap.get(edge.getTarget()));
      }
    }

    updateSubjects(productSummary, idMap);

    productSummary.updateNodeChangeStatus(
        taskChangedConceptIds.block(), projectChangedConceptIds.block());

    return idMap;
  }

  private static void updateSubjects(ProductSummary productSummary, BidiMap<String, String> idMap) {
    Set<Node> subjects = new HashSet<>(productSummary.getSubjects());

    productSummary.getSubjects().clear();

    productSummary
        .getSubjects()
        .addAll(
            subjects.stream()
                .map(
                    s -> {
                      if (!s.getConceptId().startsWith("-")) {
                        return s;
                      } else if (idMap.containsKey(s.getConceptId())) {
                        return productSummary.getNodes().stream()
                            .filter(n -> n.getConceptId().equals(idMap.get(s.getConceptId())))
                            .findFirst()
                            .orElseThrow(
                                () ->
                                    new LingoProblem(
                                        "New subject concept with id "
                                            + s.getConceptId()
                                            + " not found in identifier map of newly created concepts"));
                      } else {
                        throw new LingoProblem(
                            "New subject concept with id "
                                + s.getConceptId()
                                + " not found identifier map of newly created concepts");
                      }
                    })
                .collect(Collectors.toSet()));
  }

  private void updateConceptsWithPropertyOnlyChanges(
      String branch, ModelConfiguration modelConfiguration, ProductSummary productSummary)
      throws InterruptedException {
    Map<String, Node> nodesWithPropertyUpdates =
        productSummary.getNodes().stream()
            .filter(Node::isPropertyUpdate)
            .collect(Collectors.toMap(Node::getConceptId, n -> n));

    if (nodesWithPropertyUpdates.isEmpty()) {
      log.fine("No property updates found, skipping concept updates");
      return;
    }

    log.fine("Updating concepts with property updates");

    Mono<Set<SnowstormConcept>> browserConcepts =
        snowstormClient
            .getBrowserConcepts(branch, nodesWithPropertyUpdates.keySet())
            .collect(Collectors.toSet());

    Mono<List<SnowstormReferenceSetMember>> referenceSetMembers =
        snowstormClient.getRefsetMembersMono(branch, nodesWithPropertyUpdates.keySet(), null);

    Set<SnowstormConceptView> conceptsToUpdate = new HashSet<>();

    Objects.requireNonNull(
            browserConcepts.block(),
            "Browser response should not be null, even if there are no concepts")
        .forEach(
            concept -> {
              Node node = nodesWithPropertyUpdates.get(concept.getConceptId());
              Set<SnowstormRelationship> newRelationships =
                  calculateNonDefiningRelationships(
                      modelConfiguration, node.getNonDefiningProperties(), node.getModelLevel());

              final boolean conceptUpdated =
                  updateConceptNonDefiningRelationships(
                      concept.getRelationships(), newRelationships);

              if (conceptUpdated) {
                conceptsToUpdate.add(toSnowstormConceptView(concept));
              }
            });

    Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembershipToAdd = new HashSet<>();
    Set<SnowstormReferenceSetMember> referenceSetMembershipToDelete = new HashSet<>();
    List<SnowstormReferenceSetMember> referenceSetMemberList =
        Objects.requireNonNull(
            referenceSetMembers.block(),
            "Reference set members search response should not be null even if there are no members");

    for (Node node : nodesWithPropertyUpdates.values()) {
      Set<SnowstormReferenceSetMemberViewComponent> newReferenceSetMembers =
          calculateReferenceSetMembers(
              node.getNonDefiningProperties(), modelConfiguration, node.getModelLevel());

      Set<String> inScopeReferenceSetIds = new HashSet<>();
      final ModelLevel modelLevel = modelConfiguration.getLevelOfType(node.getModelLevel());
      inScopeReferenceSetIds.addAll(
          modelConfiguration.getReferenceSetsByLevel(modelLevel).stream()
              .map(BasePropertyDefinition::getIdentifier)
              .toList());
      inScopeReferenceSetIds.addAll(
          modelConfiguration.getMappingsByLevel(modelLevel).stream()
              .map(BasePropertyDefinition::getIdentifier)
              .toList());
      inScopeReferenceSetIds.add(modelLevel.getReferenceSetIdentifier());

      // determine which reference set members to delete
      referenceSetMemberList.stream()
          .filter(
              r -> TRUE.equals(r.getActive()) && inScopeReferenceSetIds.contains(r.getRefsetId()))
          .filter(
              existingMember ->
                  existingMember.getReferencedComponentId().equals(node.getConceptId())
                      && newReferenceSetMembers.stream()
                          .noneMatch(
                              newMember ->
                                  isMatchingRefsetTypeAndAdditionalProperties(
                                      existingMember, newMember)))
          .forEach(referenceSetMembershipToDelete::add);

      // determine which reference set members to add
      newReferenceSetMembers.stream()
          .filter(
              newMember ->
                  referenceSetMemberList.stream()
                      .noneMatch(
                          existingMember ->
                              existingMember.getReferencedComponentId().equals(node.getConceptId())
                                  && isMatchingRefsetTypeAndAdditionalProperties(
                                      existingMember, newMember)))
          .forEach(
              newReferenceSetMember -> {
                newReferenceSetMember.setReferencedComponentId(node.getConceptId());
                referenceSetMembershipToAdd.add(newReferenceSetMember);
              });
    }
    if (!conceptsToUpdate.isEmpty()) {
      log.fine(
          "Updating "
              + conceptsToUpdate.size()
              + " concepts with property updates: "
              + conceptsToUpdate.stream()
                  .map(SnowstormConceptView::getConceptId)
                  .collect(Collectors.joining(",")));
      snowstormClient.createUpdateBulkConcepts(branch, conceptsToUpdate);
    }
    if (!referenceSetMembershipToDelete.isEmpty()) {
      log.fine(
          "Deleting "
              + referenceSetMembershipToDelete.size()
              + " reference set members: "
              + referenceSetMembershipToDelete.stream()
                  .map(SnowstormReferenceSetMember::getMemberId)
                  .collect(Collectors.joining(",")));
      snowstormClient.removeRefsetMembers(branch, referenceSetMembershipToDelete);
    }
    if (!referenceSetMembershipToAdd.isEmpty()) {
      log.fine(
          "Adding "
              + referenceSetMembershipToAdd.size()
              + " reference set members: "
              + referenceSetMembershipToAdd.stream()
                  .map(SnowstormReferenceSetMemberViewComponent::getRefsetId)
                  .collect(Collectors.joining(",")));
      snowstormClient.createRefsetMemberships(branch, referenceSetMembershipToAdd);
    }
  }

  private void createOrUpdateConcepts(
      String branch, List<Node> nodeCreateOrder, Map<String, String> idMap, boolean createOnly)
      throws InterruptedException {
    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    final Deque<String> preallocatedIdentifiers =
        getPreallocatedIdentifiers(branch, nodeCreateOrder);

    boolean bulkCreate = !preallocatedIdentifiers.isEmpty();
    log.fine("Preparing concepts for creation, bulk create is " + bulkCreate);

    final Map<String, SnowstormConcept> editAndRetireConceptMap =
        getExistingConceptsToEditAndRetire(branch, nodeCreateOrder);

    // set up the concepts to create
    List<SnowstormConceptView> concepts = new ArrayList<>();
    for (Node node : nodeCreateOrder) {
      SnowstormConceptView concept;

      // if it is an edit, look up the existing concept
      if (node.isConceptEdit()) {
        concept =
            SnowstormDtoUtil.toSnowstormConceptView(
                node,
                modelConfiguration,
                editAndRetireConceptMap.get(node.getOriginalNode().getConceptId()));
      } else if (node.isRetireAndReplaceWithExisting()) {
        concept =
            SnowstormDtoUtil.toSnowstormConceptView(
                editAndRetireConceptMap.get(node.getConceptId()));
      } else {
        concept = SnowstormDtoUtil.toSnowstormConceptView(node, modelConfiguration);
      }

      updateAxiomIdentifierReferences(idMap, concept);

      updateConceptNonDefiningRelationships(
          concept.getRelationships(),
          node.getNewConceptDetails() != null
              ? node.getNewConceptDetails().getNonDefiningProperties()
              : NonDefiningPropertiesConverter.calculateNonDefiningRelationships(
                  modelConfiguration, node.getNonDefiningProperties(), node.getModelLevel()));

      String conceptId =
          node.isRetireAndReplaceWithExisting()
              ? node.getOriginalNode().getConceptId()
              : node.getNewConceptDetails().getConceptId().toString();

      // Guard for createOnly mode
      if (Long.parseLong(conceptId) >= 0 && createOnly) {
        throw new ProductAtomicDataValidationProblem(
            "Concept id must be negative for new concepts, found " + conceptId);
      }

      // if edit, then nothing to do
      // if retire and replace, then need to create refset rows - could do at the end?
      if (bulkCreate) {
        if (node.isConceptEdit() || node.isRetireAndReplaceWithExisting()) {
          concept.setConceptId(node.getOriginalNode().getConceptId());
        } else if (node.getNewConceptDetails().getSpecifiedConceptId() != null) {
          concept.setConceptId(node.getNewConceptDetails().getSpecifiedConceptId());
        } else {
          concept.setConceptId(preallocatedIdentifiers.pop());
          log.fine("Allocated identifier " + concept.getConceptId() + " for " + conceptId);
        }
        // if it is a retire and replace, then we need to set the active flag to false
        if (node.isRetireAndReplace() || node.isRetireAndReplaceWithExisting()) {
          SnowstormConcept conceptToRetire =
              editAndRetireConceptMap.get(node.getOriginalNode().getConceptId());
          conceptToRetire.setActive(false);
          concepts.add(SnowstormDtoUtil.toSnowstormConceptView(conceptToRetire));
        }
      } else {
        log.warning("Creating concept sequentially - this will be slow");
        // if it isn't a replacement with an existing concept, we need to create it
        if (node.isConceptEdit() || node.isRetireAndReplaceWithExisting()) {
          concept.setConceptId(node.getOriginalNode().getConceptId());
          concept =
              snowstormClient.updateConceptView(branch, concept.getConceptId(), concept, false);
        } else {
          concept.setConceptId(node.getNewConceptDetails().getSpecifiedConceptId());
          concept = snowstormClient.createConcept(branch, concept, false);
        }

        // if it is a retire and replace, then we need to set the active flag to false
        if (node.isRetireAndReplace() || node.isRetireAndReplaceWithExisting()) {
          SnowstormConcept conceptToRetire =
              editAndRetireConceptMap.get(node.getOriginalNode().getConceptId());
          conceptToRetire.setActive(false);
          snowstormClient.updateConceptView(
              branch,
              conceptToRetire.getConceptId(),
              SnowstormDtoUtil.toSnowstormConceptView(conceptToRetire),
              false);
        }
      }
      idMap.put(conceptId, concept.getConceptId());

      concepts.add(concept);
    }

    assertNoRemainingReferencesToPlaceholderDestinationIds(nodeCreateOrder, idMap, concepts);

    log.fine("Concepts prepared, creating concepts");

    List<SnowstormConceptMini> createdConcepts;

    if (bulkCreate) {
      log.info("Creating " + concepts.size() + " concepts with preallocated identifiers");
      createdConcepts = snowstormClient.createUpdateBulkConcepts(branch, concepts);
    } else {
      createdConcepts = concepts.stream().map(SnowstormDtoUtil::toSnowstormConceptMini).toList();
    }

    log.fine("Concepts created");

    Map<String, SnowstormConceptMini> conceptMap =
        createdConcepts.stream()
            .collect(Collectors.toMap(SnowstormConceptMini::getConceptId, c -> c));

    concepts.forEach(
        c -> {
          SnowstormConceptMini newConcept = conceptMap.get(c.getConceptId());
          if (newConcept != null) {
            newConcept.setDefinitionStatusId(getSingleAxiom(c).getDefinitionStatusId());
            newConcept.setDefinitionStatus(getSingleAxiom(c).getDefinitionStatus());
          } else {
            log.warning("Concept " + c.getConceptId() + " not found in created concepts map");
          }
        });

    nodeCreateOrder.forEach(
        node -> {
          String allocatedIdentifier =
              idMap.get(
                  node.getNewConceptDetails() != null
                      ? node.getNewConceptDetails().getConceptId().toString()
                      : node.getOriginalNode().getConceptId());
          node.setConcept(conceptMap.get(allocatedIdentifier));
        });

    createandUpdateRefsetMemberships(branch, nodeCreateOrder);

    nodeCreateOrder.forEach(
        node -> {
          if (!node.isConceptEdit()) {
            // if it isn't a concept edit, then we must have just made the concept
            node.setNewInTask(true);
          }
          node.setNewConceptDetails(null); // setting to null, we've done the create
        });

    log.fine("Concepts created and refset members created");
  }

  private Map<String, SnowstormConcept> getExistingConceptsToEditAndRetire(
      String branch, List<Node> nodeCreateOrder) {
    Set<String> editAndRetireConceptIds = new HashSet<>();

    nodeCreateOrder.stream()
        .filter(
            n -> n.isConceptEdit() || n.isRetireAndReplace() || n.isRetireAndReplaceWithExisting())
        .forEach(
            n -> {
              editAndRetireConceptIds.add(n.getOriginalNode().getConceptId());
              if (n.isRetireAndReplaceWithExisting()) {
                editAndRetireConceptIds.add(n.getConceptId());
              }
            });

    return snowstormClient
        .getBrowserConcepts(branch, editAndRetireConceptIds)
        .collect(Collectors.toMap(SnowstormConcept::getConceptId, c -> c))
        .block();
  }

  private Deque<String> getPreallocatedIdentifiers(String branch, List<Node> nodeCreateOrder)
      throws InterruptedException {
    Deque<String> preallocatedIdentifiers = new ArrayDeque<>();

    if (identifierSource.isReservationAvailable()) {
      int namespace = getNamespace(branch);

      log.fine("Reserving identifiers for new concepts, namespace is " + namespace);
      try {
        preallocatedIdentifiers.addAll(
            identifierSource
                .reserveIds(
                    namespace,
                    NamespaceConfiguration.getConceptPartitionId(namespace),
                    nodeCreateOrder.stream()
                        .filter(
                            n ->
                                n.getNewConceptDetails() != null
                                    && n.getNewConceptDetails().getSpecifiedConceptId() == null)
                        .toList()
                        .size())
                .stream()
                .map(String::valueOf)
                .toList());
      } catch (LingoProblem e) {
        log.log(
            Level.SEVERE,
            "Failed to reserve identifiers, falling back to sequential concept creation",
            e);
        preallocatedIdentifiers.clear();
      }
    }

    if (log.isLoggable(Level.FINE)) {
      log.fine("Preallocated identifiers " + String.join(",", preallocatedIdentifiers));
    }

    log.fine("Validating specified identifiers");
    // check if any concepts already exist if ids are specified
    validateSpecifiedIdentifiers(branch, nodeCreateOrder);
    return preallocatedIdentifiers;
  }

  private void createandUpdateRefsetMemberships(String branch, List<Node> nodeCreateOrder)
      throws InterruptedException {
    log.fine("Creating refset members");

    final ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);
    // for edited concepts, remove any existing members that are not in the new members
    final Set<Node> nodesToEdit =
        nodeCreateOrder.stream()
            .filter(n -> n.isConceptEdit() || n.isRetireAndReplaceWithExisting())
            .collect(Collectors.toSet());
    final Map<String, List<SnowstormReferenceSetMember>> editNodeExistingRefsetMembers =
        snowstormClient
            .getRefsetMembers(
                branch,
                nodesToEdit.stream().map(Node::getConceptId).toList(),
                modelConfiguration.getInScopeReferenceSetIds(
                    nodesToEdit.stream().map(Node::getModelLevel).collect(Collectors.toSet())))
            .stream()
            .collect(
                Collectors.toMap(
                    SnowstormReferenceSetMember::getReferencedComponentId,
                    Collections::singletonList,
                    (existing, replacement) -> {
                      List<SnowstormReferenceSetMember> combined = new ArrayList<>(existing);
                      combined.addAll(replacement);
                      return combined;
                    }));

    List<SnowstormReferenceSetMemberViewComponent> membersToCreate =
        new ArrayList<>(
            nodeCreateOrder.stream()
                .map(
                    n -> {
                      List<SnowstormReferenceSetMemberViewComponent> refsetMembers =
                          new ArrayList<>();
                      Set<SnowstormReferenceSetMemberViewComponent> newRefsetMembers =
                          n.getNewConceptDetails() != null
                              ? n.getNewConceptDetails().getReferenceSetMembers()
                              : ReferenceSetUtils.calculateReferenceSetMembers(
                                  n.getNonDefiningProperties(),
                                  modelConfiguration,
                                  n.getModelLevel());
                      if (newRefsetMembers != null) {
                        for (SnowstormReferenceSetMemberViewComponent newMember :
                            newRefsetMembers) {
                          newMember.setReferencedComponentId(n.getConcept().getConceptId());
                          if (!editNodeExistingRefsetMembers.containsKey(n.getConceptId())
                              || editNodeExistingRefsetMembers.get(n.getConceptId()).stream()
                                  .noneMatch(
                                      existingMember ->
                                          isMatchingRefsetTypeAndAdditionalProperties(
                                              existingMember, newMember))) {
                            refsetMembers.add(newMember);
                          }
                        }
                      }
                      return refsetMembers;
                    })
                .flatMap(Collection::stream)
                .toList());

    List<SnowstormReferenceSetMember> membersToDelete = new ArrayList<>();

    // add retire and replace to inactivation refset and historical association refset
    final Set<Node> retireAndReplaceNodes =
        nodeCreateOrder.stream()
            .filter(node -> node.isRetireAndReplace() || node.isRetireAndReplaceWithExisting())
            .collect(Collectors.toSet());

    if (!retireAndReplaceNodes.isEmpty()) {
      retireAndReplaceNodes.forEach(
          node -> {
            membersToCreate.add(
                new SnowstormReferenceSetMemberViewComponent()
                    .active(true)
                    .referencedComponentId(node.getOriginalNode().getNode().getConceptId())
                    .refsetId(CONCEPT_INACTIVATION_INDICATOR_REFERENCE_SET.getValue())
                    .additionalFields(
                        Map.of(
                            "valueId", node.getOriginalNode().getInactivationReason().getValue())));

            membersToCreate.add(
                new SnowstormReferenceSetMemberViewComponent()
                    .active(true)
                    .referencedComponentId(node.getOriginalNode().getNode().getConceptId())
                    .refsetId(
                        node.getOriginalNode()
                            .getInactivationReason()
                            .getHistoricalAssociationReferenceSet()
                            .getValue())
                    .additionalFields(Map.of("targetComponentId", node.getConceptId())));
          });

      // remove all the reference set members for the retired concept that are in scope
      // i.e. don't touch reference sets that aren't configured
      final List<String> retireAndReplaceIds =
          retireAndReplaceNodes.stream()
              .map(node -> node.getOriginalNode().getConceptId())
              .toList();

      final Set<String> inScopeReferenceSetIds =
          modelConfiguration.getInScopeReferenceSetIds(
              retireAndReplaceNodes.stream().map(Node::getModelLevel).collect(Collectors.toSet()));

      membersToDelete.addAll(
          snowstormClient
              .getRefsetMembers(branch, retireAndReplaceIds, inScopeReferenceSetIds)
              .stream()
              .filter(r -> Boolean.TRUE.equals(r.getActive()))
              .toList());

      nodeCreateOrder.stream()
          .filter(n -> n.getNewConceptDetails() != null)
          .forEach(
              n ->
                  n.getNewConceptDetails()
                      .getReferenceSetMembers()
                      .forEach(r -> r.setReferencedComponentId(n.getConceptId())));
    }

    if (!nodesToEdit.isEmpty()) {
      final Set<SnowstormReferenceSetMemberViewComponent> requiredNewRefsetMembers =
          new HashSet<>();
      requiredNewRefsetMembers.addAll(
          nodesToEdit.stream()
              .filter(node -> node.getNewConceptDetails() != null)
              .map(n -> n.getNewConceptDetails().getReferenceSetMembers())
              .flatMap(Collection::stream)
              .collect(Collectors.toSet()));
      requiredNewRefsetMembers.addAll(
          nodesToEdit.stream()
              .filter(node -> node.getNewConceptDetails() == null)
              .map(
                  node -> {
                    Set<SnowstormReferenceSetMemberViewComponent> refsetMembers =
                        ReferenceSetUtils.calculateReferenceSetMembers(
                            node.getNonDefiningProperties(),
                            modelConfiguration,
                            node.getModelLevel());
                    refsetMembers.forEach(r -> r.setReferencedComponentId(node.getConceptId()));
                    return refsetMembers;
                  })
              .flatMap(Collection::stream)
              .collect(Collectors.toSet()));
      membersToDelete.addAll(
          editNodeExistingRefsetMembers.values().stream()
              .flatMap(Collection::stream)
              .filter(
                  existingRefset ->
                      Boolean.TRUE.equals(existingRefset.getActive())
                          && requiredNewRefsetMembers.stream()
                              .noneMatch(
                                  newRefset ->
                                      newRefset.getRefsetId() != null
                                          && newRefset
                                              .getRefsetId()
                                              .equals(existingRefset.getRefsetId())
                                          && Objects.equals(
                                              newRefset.getReferencedComponentId(),
                                              existingRefset.getReferencedComponentId())
                                          && Objects.equals(
                                              newRefset.getAdditionalFields(),
                                              existingRefset.getAdditionalFields())))
              .toList());
    }

    if (!membersToDelete.isEmpty()) {
      snowstormClient.removeRefsetMembers(branch, new HashSet<>(membersToDelete));
    }
    if (!membersToCreate.isEmpty()) {
      snowstormClient.createRefsetMembers(branch, membersToCreate);
    }
  }

  private int getNamespace(String branch) {
    List<String> branchAttempts = new ArrayList<>();

    do {
      log.fine("Retrieving namespace for branch " + branch);
      branchAttempts.add(branch);
      Integer namespace = namespaceConfiguration.getNamespace(branch.replace("|", "_"));
      if (namespace != null) {
        log.fine("Namespace found for branch " + branch + ": " + namespace);
        return namespace;
      }
      log.fine("Namespace not found for branch " + branch + ", trying parent branch");
      branch = branch.substring(0, branch.lastIndexOf("|"));
    } while (branch.contains("|"));

    log.fine("Retrieving namespace for branch " + branch);
    branchAttempts.add(branch);
    Integer namespace = namespaceConfiguration.getNamespace(branch);

    if (namespace == null) {
      log.severe(
          "No namespace found for branch "
              + branch
              + " after all attempts: "
              + String.join(", ", branchAttempts));
      throw new NamespaceNotConfiguredProblem(branchAttempts);
    }

    return namespace;
  }

  private void validateSpecifiedIdentifiers(String branch, List<Node> nodeCreateOrder) {
    Set<String> idsToCreate =
        nodeCreateOrder.stream()
            .filter(n -> n.getNewConceptDetails() != null)
            .map(n -> n.getNewConceptDetails().getSpecifiedConceptId())
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

    if (!idsToCreate.isEmpty()) {
      Collection<String> existingConcepts =
          snowstormClient.conceptIdsThatExist(branch, idsToCreate);

      if (!existingConcepts.isEmpty()) {
        throw new ProductAtomicDataValidationProblem(
            "Concepts with ids "
                + String.join(", ", existingConcepts)
                + " already exist, cannot create new concepts with the specified ids");
      }
    }
  }

  @SuppressWarnings("java:S1192")
  private void updateTicket(
      BulkProductAction<?> creationDetails, TicketDto ticket, BulkProductActionDto dto) {
    try {
      ticketService.putBulkProductActionOnTicket(ticket.getId(), dto);
    } catch (Exception e) {
      String dtoString = null;
      try {
        dtoString = objectMapper.writeValueAsString(dto);
      } catch (Exception ex) {
        log.log(Level.SEVERE, "Failed to serialise dto", ex);
      }

      log.log(
          Level.SEVERE,
          "Saving the bulk details failed after the product/s were created. "
              + "Bulk details were not saved on the ticket, details were "
              + dtoString,
          e);
    }

    if (creationDetails.getPartialSaveName() != null
        && !creationDetails.getPartialSaveName().isEmpty()) {
      try {
        ticketService.deleteProduct(ticket.getId(), creationDetails.getPartialSaveName());
      } catch (ResourceNotFoundProblem p) {
        log.warning(
            "Partial save name "
                + creationDetails.getPartialSaveName()
                + " on ticket "
                + ticket.getId()
                + " could not be found to be deleted on product creation. "
                + "Ignored to allow new product details to be saved to the ticket.");
      } catch (Exception e) {
        log.log(
            Level.SEVERE,
            "Delete of partial save name "
                + creationDetails.getPartialSaveName()
                + " on ticket "
                + ticket.getId()
                + " failed for new product creation. "
                + "Ignored to allow new product details to be saved to the ticket.",
            e);
      }
    }
  }

  @SuppressWarnings("java:S1192")
  private void updateTicket(TicketDto ticket, ProductDto productDto, String partialSaveName) {
    try {
      ticketService.putProductOnTicket(ticket.getId(), productDto);
    } catch (Exception e) {
      String dtoString = null;
      try {
        dtoString = objectMapper.writeValueAsString(productDto);
      } catch (Exception ex) {
        log.log(Level.SEVERE, "Failed to serialise productDto", ex);
      }

      log.log(
          Level.SEVERE,
          "Saving the product details failed after the product was created. "
              + "Product details were not saved on the ticket, details were "
              + dtoString,
          e);
    }

    if (partialSaveName != null && !partialSaveName.isEmpty()) {
      try {
        ticketService.deleteProduct(ticket.getId(), Long.parseLong(partialSaveName));
      } catch (ResourceNotFoundProblem p) {
        log.warning(
            "Partial save name "
                + partialSaveName
                + " on ticket "
                + ticket.getId()
                + " could not be found to be deleted on product creation. "
                + "Ignored to allow new product details to be saved to the ticket.");
      } catch (Exception e) {
        log.log(
            Level.SEVERE,
            "Delete of partial save name "
                + partialSaveName
                + " on ticket "
                + ticket.getId()
                + " failed for new product creation. "
                + "Ignored to allow new product details to be saved to the ticket.",
            e);
      }
    }
  }
}
