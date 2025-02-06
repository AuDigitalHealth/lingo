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

import static au.gov.digitalhealth.lingo.service.ProductSummaryService.CTPP_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.MPP_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.MPUU_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.MP_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.TPP_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.TPUU_LABEL;
import static au.gov.digitalhealth.lingo.util.AmtConstants.*;
import static au.gov.digitalhealth.lingo.util.ExternalIdentifierUtils.getExternalIdentifierReferenceSet;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.*;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.*;

import au.csiro.snowstorm_client.model.*;
import au.gov.digitalhealth.lingo.configuration.FieldBindingConfiguration;
import au.gov.digitalhealth.lingo.configuration.NamespaceConfiguration;
import au.gov.digitalhealth.lingo.exception.EmptyProductCreationProblem;
import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.exception.NamespaceNotConfiguredProblem;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.lingo.product.BrandCreationRequest;
import au.gov.digitalhealth.lingo.product.Edge;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductCreationDetails;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.bulk.BrandPackSizeCreationDetails;
import au.gov.digitalhealth.lingo.product.bulk.BulkProductAction;
import au.gov.digitalhealth.lingo.product.details.ProductDetails;
import au.gov.digitalhealth.lingo.service.identifier.IdentifierSource;
import au.gov.digitalhealth.lingo.util.OwlAxiomService;
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
import java.util.*;
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

  SnowstormClient snowstormClient;
  NameGenerationService nameGenerationService;
  TicketServiceImpl ticketService;
  OwlAxiomService owlAxiomService;
  ObjectMapper objectMapper;
  IdentifierSource identifierSource;
  NamespaceConfiguration namespaceConfiguration;

  ModifiedGeneratedNameService modifiedGeneratedNameService;
  FieldBindingConfiguration fieldBindingConfiguration;

  public ProductCreationService(
      SnowstormClient snowstormClient,
      NameGenerationService nameGenerationService,
      TicketServiceImpl ticketService,
      OwlAxiomService owlAxiomService,
      ObjectMapper objectMapper,
      IdentifierSource identifierSource,
      NamespaceConfiguration namespaceConfiguration,
      ModifiedGeneratedNameService modifiedGeneratedNameService,
      FieldBindingConfiguration fieldBindingConfiguration) {
    this.snowstormClient = snowstormClient;
    this.nameGenerationService = nameGenerationService;
    this.ticketService = ticketService;
    this.owlAxiomService = owlAxiomService;
    this.objectMapper = objectMapper;
    this.identifierSource = identifierSource;
    this.namespaceConfiguration = namespaceConfiguration;
    this.modifiedGeneratedNameService = modifiedGeneratedNameService;
    this.fieldBindingConfiguration = fieldBindingConfiguration;
  }

  private static void updateAxiomIdentifierReferences(
      Map<String, String> idMap, SnowstormConceptView concept) {
    // if the concept references a concept that has just been created, update the destination
    // from the placeholder negative number to the new SCTID
    concept
        .getClassAxioms()
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
        .flatMap(c -> c.getClassAxioms().stream().flatMap(a -> a.getRelationships().stream()))
        .anyMatch(
            r ->
                Boolean.FALSE.equals(r.getConcrete())
                    && Long.parseLong(Objects.requireNonNull(r.getDestinationId())) < 0)) {

      List<SnowstormConceptView> offendingConcepts =
          concepts.stream()
              .filter(
                  c ->
                      c.getClassAxioms().stream()
                          .anyMatch(
                              a ->
                                  a.getRelationships().stream()
                                      .anyMatch(
                                          r ->
                                              Boolean.FALSE.equals(r.getConcrete())
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

  public ProductSummary createProductFromBrandPackSizeCreationDetails(
      String branch, @Valid BulkProductAction<BrandPackSizeCreationDetails> creationDetails)
      throws InterruptedException {

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
        productSummary.calculateSubject(false).stream()
            .filter(Node::isNewConcept)
            .collect(Collectors.toSet());

    BidiMap<String, String> idMap = create(branch, productSummary, false);

    if (productSummaryClone != null) {
      modifiedGeneratedNameService.createAndSaveModifiedGeneratedNames(
          creationDetails.getDetails().getIdFsnMap(), productSummaryClone, branch, idMap);
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
   * Creates the product concepts in the ProductSummary that are new concepts and returns an updated
   * ProductSummary with the new concepts.
   *
   * @param branch branch to write the changes to
   * @param productCreationDetails ProductCreationDetails containing the concepts to create
   * @return ProductSummary with the new concepts
   */
  public ProductSummary createProductFromAtomicData(
      String branch, @Valid ProductCreationDetails<? extends ProductDetails> productCreationDetails)
      throws InterruptedException {

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

    if (productSummary.getNodes().stream().noneMatch(Node::isNewConcept)) {
      throw new EmptyProductCreationProblem();
    }

    BidiMap<String, String> idMap = create(branch, productSummary, true);

    if (productSummaryClone != null) {
      modifiedGeneratedNameService.createAndSaveModifiedGeneratedNames(
          productCreationDetails.getPackageDetails().getIdFsnMap(),
          productSummaryClone,
          branch,
          idMap);
    }

    ProductDto productDto =
        ProductDto.builder()
            .conceptId(productSummary.getSingleSubject().getConceptId())
            .packageDetails(productCreationDetails.getPackageDetails())
            .name(
                productCreationDetails.getNameOverride() != null
                    ? productCreationDetails.getNameOverride()
                    : productSummary.getSingleSubject().getFullySpecifiedName())
            .build();

    updateTicket(productCreationDetails, ticket, productDto);
    return productSummary;
  }

  public SnowstormConceptMini createBrand(
      String branch, @Valid BrandCreationRequest brandCreationRequest) throws InterruptedException {

    // Validate that the ticket exists
    ticketService.findTicket(brandCreationRequest.getTicketId());

    // Generate the fully specified name (FSN) for the brand
    String semanticTag = fieldBindingConfiguration.getBrandSemanticTag();

    String generatePT = generatePT(brandCreationRequest.getBrandName().trim(), semanticTag);
    String generatedFsn = String.format("%s %s", generatePT, semanticTag);

    SnowstormConceptView createdConcept =
        createPrimitiveConcept(
            branch,
            generatedFsn,
            generatePT,
            Set.of(getSnowstormRelationship(IS_A, PRODUCT_NAME, 0)));

    // put in the 929360021000036102 reference set
    addToRefset(branch, createdConcept.getConceptId(), TP_REFSET_ID.getValue());
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
    snowstormClient.checkForDuplicateFsn(fsn, branch);
    // Create and configure the new Snowstorm concept
    SnowstormConceptView newConcept = new SnowstormConceptView();
    newConcept.setActive(true);
    newConcept.setDefinitionStatusId(PRIMITIVE.getValue());

    // Add descriptions to the concept (synonym and fully specified name)
    SnowstormDtoUtil.addDescription(newConcept, pt, SnomedConstants.SYNONYM.getValue());
    SnowstormDtoUtil.addDescription(newConcept, fsn, SnomedConstants.FSN.getValue());

    // Add the axiom to the concept
    SnowstormAxiom axiom = createPrimitiveAxiom(relationships);
    newConcept.setClassAxioms(Set.of(axiom));

    // Create the concept in Snowstorm and return the result
    return snowstormClient.createConcept(branch, newConcept, false);
  }

  private SnowstormAxiom createPrimitiveAxiom(Set<SnowstormRelationship> relationships) {
    SnowstormAxiom axiom = new SnowstormAxiom();
    axiom.active(true);
    axiom.setModuleId(SCT_AU_MODULE.getValue()); // Noticed coming as null
    axiom.setDefinitionStatusId(PRIMITIVE.getValue());
    axiom.setDefinitionStatus("PRIMITIVE");
    axiom.setRelationships(relationships);
    axiom.setReleased(false);
    return axiom;
  }

  private void addToRefset(String branch, String conceptId, String refsetId)
      throws InterruptedException {
    List<SnowstormReferenceSetMemberViewComponent> refsetMembers = new ArrayList<>();
    refsetMembers.add(
        new SnowstormReferenceSetMemberViewComponent()
            .active(true)
            .refsetId(refsetId)
            .referencedComponentId(conceptId)
            .moduleId(SCT_AU_MODULE.getValue()));

    snowstormClient.createRefsetMembers(branch, refsetMembers);
  }

  private BidiMap<String, String> create(
      String branch, ProductSummary productSummary, boolean singleSubject)
      throws InterruptedException {

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

    Set<Node> subjects = productSummary.calculateSubject(singleSubject);

    // This is really for the device scenario, where the user has selected an existing concept as
    // the device type that isn't already an MP.
    productSummary.getNodes().stream()
        .filter(
            n ->
                !n.isNewConcept()
                    && n.getLabel().equals(ProductSummaryService.MP_LABEL)
                    && snowstormClient
                        .getConceptIdsFromEcl(
                            branch, "^" + MP_REFSET_ID + " AND " + n.getConceptId(), 0, 1)
                        .isEmpty())
        .forEach(
            n ->
                snowstormClient.createRefsetMembership(
                    branch, MP_REFSET_ID.getValue(), n.getConceptId(), true));

    List<Node> nodeCreateOrder =
        productSummary.getNodes().stream()
            .filter(Node::isNewConcept)
            .sorted(Node.getNodeComparator(productSummary.getNodes()))
            .toList();

    // Force Snowstorm to work from the ids rather than the SnowstormConceptMini objects
    // which were added for diagramming
    nodeCreateOrder.forEach(
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

    if (log.isLoggable(Level.FINE)) {
      log.fine(
          "Creating concepts in order "
              + nodeCreateOrder.stream()
                  .map(n -> n.getConceptId() + "_" + n.getLabel())
                  .collect(Collectors.joining(", ")));
      nodeCreateOrder.forEach(
          n ->
              n.getNewConceptDetails().getAxioms().stream()
                  .flatMap(a -> a.getRelationships().stream())
                  .filter(
                      r ->
                          Boolean.FALSE.equals(r.getConcrete())
                              && r.getDestinationId() != null
                              && Long.parseLong(r.getDestinationId()) < 0)
                  .forEach(
                      r ->
                          log.fine(
                              "Relationship " + n.getConceptId() + " -> " + r.getDestinationId())));
    }

    BidiMap<String, String> idMap = new DualHashBidiMap<>();

    createConcepts(branch, nodeCreateOrder, idMap);

    for (Edge edge : productSummary.getEdges()) {
      if (idMap.containsKey(edge.getSource())) {
        edge.setSource(idMap.get(edge.getSource()));
      }
      if (idMap.containsKey(edge.getTarget())) {
        edge.setTarget(idMap.get(edge.getTarget()));
      }
    }

    productSummary.getSubjects().clear();
    productSummary.getSubjects().addAll(subjects);

    productSummary.updateNodeChangeStatus(
        taskChangedConceptIds.block(), projectChangedConceptIds.block());

    return idMap;
  }

  private void createConcepts(String branch, List<Node> nodeCreateOrder, Map<String, String> idMap)
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
                        .filter(n -> n.getNewConceptDetails().getSpecifiedConceptId() == null)
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

    log.fine("Preparing concepts");
    boolean bulkCreate = !preallocatedIdentifiers.isEmpty();
    // set up the concepts to create
    List<SnowstormConceptView> concepts = new ArrayList<>();
    for (Node node : nodeCreateOrder) {
      SnowstormConceptView concept = SnowstormDtoUtil.toSnowstormConceptView(node);

      updateAxiomIdentifierReferences(idMap, concept);

      String conceptId = node.getNewConceptDetails().getConceptId().toString();
      if (Long.parseLong(conceptId) < 0) {
        if (!bulkCreate) {
          log.warning("Creating concept sequentially - this will be slow");
          concept.setConceptId(node.getNewConceptDetails().getSpecifiedConceptId());
          concept = snowstormClient.createConcept(branch, concept, false);
        } else if (node.getNewConceptDetails().getSpecifiedConceptId() != null) {
          concept.setConceptId(node.getNewConceptDetails().getSpecifiedConceptId());
        } else {
          concept.setConceptId(preallocatedIdentifiers.pop());
          log.fine("Allocated identifier " + concept.getConceptId() + " for " + conceptId);
        }
        idMap.put(conceptId, concept.getConceptId());
      } else {
        throw new ProductAtomicDataValidationProblem(
            "Concept id must be negative for new concepts, found " + conceptId);
      }

      concepts.add(concept);
    }

    assertNoRemainingReferencesToPlaceholderDestinationIds(nodeCreateOrder, idMap, concepts);

    log.fine("Concepts prepared, creating concepts");

    List<SnowstormConceptMini> createdConcepts;

    if (bulkCreate) {
      log.info("Creating " + concepts.size() + " concepts with preallocated identifiers");
      createdConcepts = snowstormClient.createConcepts(branch, concepts);
    } else {
      createdConcepts = concepts.stream().map(SnowstormDtoUtil::toSnowstormConceptMini).toList();
    }

    log.fine("Concepts created");

    Map<String, SnowstormConceptMini> conceptMap =
        createdConcepts.stream()
            .collect(Collectors.toMap(SnowstormConceptMini::getConceptId, c -> c));

    nodeCreateOrder.forEach(
        node -> {
          String allocatedIdentifier =
              idMap.get(node.getNewConceptDetails().getConceptId().toString());
          node.setConcept(conceptMap.get(allocatedIdentifier));
        });

    createRefsetMemberships(branch, nodeCreateOrder);

    nodeCreateOrder.forEach(
        n -> {
          if (n.getLabel().equals(CTPP_LABEL)
              && n.getNewConceptDetails() != null) { // populate external identifiers in response
            n.getExternalIdentifiers()
                .addAll(
                    getExternalIdentifierReferenceSet(
                        n.getNewConceptDetails().getReferenceSetMembers(), n.getConceptId()));
          }
          n.setNewConceptDetails(null);
        });

    log.fine("Concepts created and refset members created");
  }

  public List<String> createRefsetMemberships(String branch, List<Node> nodeCreateOrder)
      throws InterruptedException {
    log.fine("Creating refset members");
    List<SnowstormReferenceSetMemberViewComponent> referenceSetMemberViewComponents =
        nodeCreateOrder.stream()
            .map(
                n -> {
                  List<SnowstormReferenceSetMemberViewComponent> refsetMembers = new ArrayList<>();
                  refsetMembers.add(
                      new SnowstormReferenceSetMemberViewComponent()
                          .active(true)
                          .refsetId(getRefsetId(n.getLabel()))
                          .referencedComponentId(n.getConcept().getConceptId())
                          .moduleId(SCT_AU_MODULE.getValue()));

                  if (n.getNewConceptDetails().getReferenceSetMembers() != null) {
                    for (SnowstormReferenceSetMemberViewComponent member :
                        n.getNewConceptDetails().getReferenceSetMembers()) {
                      member.setReferencedComponentId(n.getConcept().getConceptId());
                      refsetMembers.add(member);
                    }
                  }
                  return refsetMembers;
                })
            .flatMap(Collection::stream)
            .toList();

    return snowstormClient.createRefsetMembers(branch, referenceSetMemberViewComponents);
  }

  private int getNamespace(String branch) {
    do {
      Integer namespace = namespaceConfiguration.getNamespace(branch.replace("|", "_"));
      if (namespace != null) {
        return namespace;
      }
      branch = branch.substring(0, branch.lastIndexOf("|"));
    } while (branch.contains("|"));

    Integer namespace = namespaceConfiguration.getNamespace(branch);

    if (namespace == null) {
      throw new NamespaceNotConfiguredProblem(branch);
    }

    return namespace;
  }

  private void validateSpecifiedIdentifiers(String branch, List<Node> nodeCreateOrder) {
    Set<String> idsToCreate =
        nodeCreateOrder.stream()
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
  private void updateTicket(
      ProductCreationDetails<? extends ProductDetails> productCreationDetails,
      TicketDto ticket,
      ProductDto productDto) {
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

    if (productCreationDetails.getPartialSaveName() != null
        && !productCreationDetails.getPartialSaveName().isEmpty()) {
      try {
        ticketService.deleteProduct(
            ticket.getId(), Long.parseLong(productCreationDetails.getPartialSaveName()));
      } catch (ResourceNotFoundProblem p) {
        log.warning(
            "Partial save name "
                + productCreationDetails.getPartialSaveName()
                + " on ticket "
                + ticket.getId()
                + " could not be found to be deleted on product creation. "
                + "Ignored to allow new product details to be saved to the ticket.");
      } catch (Exception e) {
        log.log(
            Level.SEVERE,
            "Delete of partial save name "
                + productCreationDetails.getPartialSaveName()
                + " on ticket "
                + ticket.getId()
                + " failed for new product creation. "
                + "Ignored to allow new product details to be saved to the ticket.",
            e);
      }
    }
  }

  private String getRefsetId(String label) {
    return switch (label) {
      case MPP_LABEL -> MPP_REFSET_ID.getValue();
      case TPP_LABEL -> TPP_REFSET_ID.getValue();
      case CTPP_LABEL -> CTPP_REFSET_ID.getValue();
      case MP_LABEL -> MP_REFSET_ID.getValue();
      case MPUU_LABEL -> MPUU_REFSET_ID.getValue();
      case TPUU_LABEL -> TPUU_REFSET_ID.getValue();
      default -> throw new IllegalArgumentException("Unknown refset for label " + label);
    };
  }
}
