package com.csiro.snomio.service;

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
import static com.csiro.snomio.util.AmtConstants.TPP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.TPUU_REFSET_ID;
import static com.csiro.snomio.util.SnowstormDtoUtil.toSnowstormConceptMini;

import au.csiro.snowstorm_client.model.SnowstormConceptView;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import com.csiro.snomio.exception.EmptyProductCreationProblem;
import com.csiro.snomio.exception.ProductAtomicDataValidationProblem;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.snomio.product.Edge;
import com.csiro.snomio.product.NewConceptDetails;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Log
@Service
public class ProductCreationService {

  SnowstormClient snowstormClient;
  NameGenerationService nameGenerationService;
  TicketService ticketService;
  OwlAxiomService owlAxiomService;
  ObjectMapper objectMapper;

  @Autowired
  public ProductCreationService(
      SnowstormClient snowstormClient,
      NameGenerationService nameGenerationService,
      TicketService ticketService,
      OwlAxiomService owlAxiomService,
      ObjectMapper objectMapper) {
    this.snowstormClient = snowstormClient;
    this.nameGenerationService = nameGenerationService;
    this.ticketService = ticketService;
    this.owlAxiomService = owlAxiomService;
    this.objectMapper = objectMapper;
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

    nodeCreateOrder.forEach(n -> createConcept(branch, n, idMap));

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
    return productSummary;
  }

  private void createConcept(String branch, Node node, Map<String, String> idMap) {
    SnowstormConceptView concept = SnowstormDtoUtil.toSnowstormConceptView(node);

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

    NewConceptDetails newConceptDetails = node.getNewConceptDetails();

    if (newConceptDetails.getSpecifiedConceptId() != null
        && snowstormClient.conceptExists(branch, newConceptDetails.getSpecifiedConceptId())) {
      throw new ProductAtomicDataValidationProblem(
          "Concept with id " + newConceptDetails.getSpecifiedConceptId() + " already exists");
    }

    if (Long.parseLong(concept.getConceptId()) < 0) {
      concept.setConceptId(null);
    }

    concept = snowstormClient.createConcept(branch, concept, false);

    node.setConcept(toSnowstormConceptMini(concept));
    node.setNewConceptDetails(null);
    if (!newConceptDetails.getConceptId().toString().equals(concept.getConceptId())) {
      idMap.put(newConceptDetails.getConceptId().toString(), concept.getConceptId());
    }

    snowstormClient.createRefsetMembership(
        branch, getRefsetId(node.getLabel()), concept.getConceptId());

    if (newConceptDetails.getReferenceSetMembers() != null) {
      for (SnowstormReferenceSetMemberViewComponent member :
          newConceptDetails.getReferenceSetMembers()) {
        member.setReferencedComponentId(concept.getConceptId());
        snowstormClient.createRefsetMembership(branch, member);
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
