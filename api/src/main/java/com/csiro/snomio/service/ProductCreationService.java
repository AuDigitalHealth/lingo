package com.csiro.snomio.service;

import static com.csiro.snomio.configuration.NamespaceConfiguration.getConceptPartitionId;
import static com.csiro.snomio.service.ProductSummaryService.CTPP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.MPP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.MPUU_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.MP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.TPP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.TPUU_LABEL;
import static com.csiro.snomio.util.AmtConstants.CTPP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.MPP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.MPUU_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.MP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.SCT_AU_MODULE;
import static com.csiro.snomio.util.AmtConstants.TPP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.TPUU_REFSET_ID;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormConceptView;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import com.csiro.snomio.configuration.NamespaceConfiguration;
import com.csiro.snomio.exception.EmptyProductCreationProblem;
import com.csiro.snomio.exception.NamespaceNotConfiguredProblem;
import com.csiro.snomio.exception.ProductAtomicDataValidationProblem;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.snomio.product.Edge;
import com.csiro.snomio.product.Node;
import com.csiro.snomio.product.ProductCreationDetails;
import com.csiro.snomio.product.ProductSummary;
import com.csiro.snomio.product.details.ProductDetails;
import com.csiro.snomio.util.OwlAxiomService;
import com.csiro.snomio.util.SnowstormDtoUtil;
import com.csiro.tickets.controllers.dto.ProductDto;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.service.TicketService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Deque;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Log
@Service
public class ProductCreationService {

  SnowstormClient snowstormClient;
  NameGenerationService nameGenerationService;
  TicketService ticketService;
  OwlAxiomService owlAxiomService;
  ObjectMapper objectMapper;
  IdentifierSource identifierSource;
  NamespaceConfiguration namespaceConfiguration;

  @Autowired
  public ProductCreationService(
      SnowstormClient snowstormClient,
      NameGenerationService nameGenerationService,
      TicketService ticketService,
      OwlAxiomService owlAxiomService,
      ObjectMapper objectMapper,
      @Qualifier("identifierStorage") IdentifierSource identifierSource,
      NamespaceConfiguration namespaceConfiguration) {
    this.snowstormClient = snowstormClient;
    this.nameGenerationService = nameGenerationService;
    this.ticketService = ticketService;
    this.owlAxiomService = owlAxiomService;
    this.objectMapper = objectMapper;
    this.identifierSource = identifierSource;
    this.namespaceConfiguration = namespaceConfiguration;
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

  /**
   * Creates the product concepts in the ProductSummary that are new concepts and returns an updated
   * ProductSummary with the new concepts.
   *
   * @param branch branch to write the changes to
   * @param productCreationDetails ProductCreationDetails containing the concepts to create
   * @return ProductSummary with the new concepts
   */
  public ProductSummary createProductFromAtomicData(
      String branch,
      @Valid ProductCreationDetails<? extends ProductDetails> productCreationDetails) {

    // validate the ticket exists
    TicketDto ticket = ticketService.findTicket(productCreationDetails.getTicketId());

    ProductSummary productSummary = productCreationDetails.getProductSummary();
    if (productSummary.getNodes().stream().noneMatch(Node::isNewConcept)) {
      throw new EmptyProductCreationProblem();
    }

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

    Node subject = productSummary.calculateSubject();

    // This is really for the device scenario, where the user has selected an existing concept as
    // the device type that isn't already an MP.
    productSummary.getNodes().stream()
        .filter(
            n ->
                !n.isNewConcept()
                    && n.getLabel().equals(MP_LABEL)
                    && snowstormClient
                        .getConceptIdsFromEcl(
                            branch, "^" + MP_REFSET_ID + " AND " + n.getConceptId(), 0, 1)
                        .isEmpty())
        .forEach(
            n ->
                snowstormClient.createRefsetMembership(
                    branch, MP_REFSET_ID.getValue(), n.getConceptId()));

    List<Node> nodeCreateOrder =
        productSummary.getNodes().stream()
            .filter(Node::isNewConcept)
            .sorted(Node.getNodeComparator(productSummary.getNodes()))
            .toList();

    if (log.isLoggable(Level.FINE)) {
      log.fine(
          "Creating concepts in order "
              + nodeCreateOrder.stream()
                  .map(n -> n.getConceptId() + "_" + n.getLabel())
                  .collect(Collectors.joining(", ")));
    }

    Map<String, String> idMap = new HashMap<>();

    createConcepts(branch, nodeCreateOrder, idMap);

    for (Edge edge : productSummary.getEdges()) {
      if (idMap.containsKey(edge.getSource())) {
        edge.setSource(idMap.get(edge.getSource()));
      }
      if (idMap.containsKey(edge.getTarget())) {
        edge.setTarget(idMap.get(edge.getTarget()));
      }
    }

    productSummary.setSubject(subject);

    ProductDto productDto =
        ProductDto.builder()
            .conceptId(productSummary.getSubject().getConceptId())
            .packageDetails(productCreationDetails.getPackageDetails())
            .name(productSummary.getSubject().getFullySpecifiedName())
            .build();

    updateTicket(productCreationDetails, ticket, productDto);
    return productSummary;
  }

  private void createConcepts(
      String branch, List<Node> nodeCreateOrder, Map<String, String> idMap) {
    // todo collect and preallocate identifiers if possible - populate map
    Deque<String> preallocatedIdentifiers = new ArrayDeque<>();

    if (identifierSource.isReservationAvailable()) {
      int namespace = getNamespace(branch);

      log.fine("Reserving identifiers for new concepts, namespace is " + namespace);
      preallocatedIdentifiers.addAll(
          identifierSource
              .reserveIds(
                  namespace,
                  getConceptPartitionId(namespace),
                  nodeCreateOrder.stream()
                      .filter(n -> n.getNewConceptDetails().getSpecifiedConceptId() == null)
                      .toList()
                      .size())
              .stream()
              .map(String::valueOf)
              .toList());
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
          log.warning("Creating concept sequentally - this will be slow");
          concept.setConceptId(node.getNewConceptDetails().getSpecifiedConceptId());
          concept = snowstormClient.createConcept(branch, concept, false);
        } else {
          concept.setConceptId(preallocatedIdentifiers.pop());
        }
        idMap.put(conceptId, concept.getConceptId());
      } else {
        throw new ProductAtomicDataValidationProblem(
            "Concept id must be negative for new concepts, found " + conceptId);
      }

      concepts.add(concept);
    }

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

    snowstormClient.createRefsetMembers(branch, referenceSetMemberViewComponents);

    nodeCreateOrder.forEach(n -> n.setNewConceptDetails(null));

    log.fine("Concepts created and refset members created");
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
    // todo this can be optimised to get all the concepts in one request, but that doesn't seem to
    // work in Snowstorm's API at the moment
    for (Node node : nodeCreateOrder) {
      if (node.getNewConceptDetails().getSpecifiedConceptId() != null) {
        SnowstormConceptMini concept =
            snowstormClient.getConcept(branch, node.getNewConceptDetails().getSpecifiedConceptId());
        if (concept != null) {
          throw new ProductAtomicDataValidationProblem(
              "Concepts with id "
                  + node.getNewConceptDetails().getSpecifiedConceptId()
                  + " already exists, cannot create new concepts with the specified ids");
        }
      }
    }
  }

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
        ticketService.deleteProduct(ticket.getId(), productCreationDetails.getPartialSaveName());
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
