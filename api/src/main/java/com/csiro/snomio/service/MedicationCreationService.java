package com.csiro.snomio.service;

import static com.csiro.snomio.service.ProductService.CONTAINS_LABEL;
import static com.csiro.snomio.service.ProductService.CTPP_LABEL;
import static com.csiro.snomio.service.ProductService.HAS_PRODUCT_NAME_LABEL;
import static com.csiro.snomio.service.ProductService.IS_A_LABEL;
import static com.csiro.snomio.service.ProductService.MPP_LABEL;
import static com.csiro.snomio.service.ProductService.MPUU_LABEL;
import static com.csiro.snomio.service.ProductService.MP_LABEL;
import static com.csiro.snomio.service.ProductService.TPP_LABEL;
import static com.csiro.snomio.service.ProductService.TPUU_LABEL;
import static com.csiro.snomio.service.ProductService.TP_LABEL;
import static com.csiro.snomio.util.AmtConstants.ARTGID_REFSET;
import static com.csiro.snomio.util.AmtConstants.ARTGID_SCHEME;
import static com.csiro.snomio.util.AmtConstants.CONCENTRATION_STRENGTH_UNIT;
import static com.csiro.snomio.util.AmtConstants.CONCENTRATION_STRENGTH_VALUE;
import static com.csiro.snomio.util.AmtConstants.CONTAINS_PACKAGED_CD;
import static com.csiro.snomio.util.AmtConstants.COUNT_OF_CONTAINED_COMPONENT_INGREDIENT;
import static com.csiro.snomio.util.AmtConstants.COUNT_OF_CONTAINED_PACKAGE_TYPE;
import static com.csiro.snomio.util.AmtConstants.CTPP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.HAS_CONTAINER_TYPE;
import static com.csiro.snomio.util.AmtConstants.HAS_DEVICE_TYPE;
import static com.csiro.snomio.util.AmtConstants.HAS_OTHER_IDENTIFYING_INFORMATION;
import static com.csiro.snomio.util.AmtConstants.HAS_TOTAL_QUANTITY_UNIT;
import static com.csiro.snomio.util.AmtConstants.HAS_TOTAL_QUANTITY_VALUE;
import static com.csiro.snomio.util.AmtConstants.MPP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.MPUU_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.MP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.SCT_AU_MODULE;
import static com.csiro.snomio.util.AmtConstants.TPP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.TPUU_REFSET_ID;
import static com.csiro.snomio.util.SnomedConstants.BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.BRANDED_CLINICAL_DRUG_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CLINICAL_DRUG_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CONTAINERIZED_BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CONTAINS_CD;
import static com.csiro.snomio.util.SnomedConstants.COUNT_OF_ACTIVE_INGREDIENT;
import static com.csiro.snomio.util.SnomedConstants.DEFINED;
import static com.csiro.snomio.util.SnomedConstants.HAS_ACTIVE_INGREDIENT;
import static com.csiro.snomio.util.SnomedConstants.HAS_BOSS;
import static com.csiro.snomio.util.SnomedConstants.HAS_MANUFACTURED_DOSE_FORM;
import static com.csiro.snomio.util.SnomedConstants.HAS_PACK_SIZE_UNIT;
import static com.csiro.snomio.util.SnomedConstants.HAS_PACK_SIZE_VALUE;
import static com.csiro.snomio.util.SnomedConstants.HAS_PRECISE_ACTIVE_INGREDIENT;
import static com.csiro.snomio.util.SnomedConstants.HAS_PRODUCT_NAME;
import static com.csiro.snomio.util.SnomedConstants.IS_A;
import static com.csiro.snomio.util.SnomedConstants.MEDICINAL_PRODUCT;
import static com.csiro.snomio.util.SnomedConstants.MEDICINAL_PRODUCT_PACKAGE;
import static com.csiro.snomio.util.SnomedConstants.MEDICINAL_PRODUCT_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.PRIMITIVE;
import static com.csiro.snomio.util.SnomedConstants.UNIT_OF_PRESENTATION;
import static com.csiro.snomio.util.SnowstormDtoUtil.addQuantityIfNotNull;
import static com.csiro.snomio.util.SnowstormDtoUtil.addRelationshipIfNotNull;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSnowstormDatatypeComponent;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSnowstormRelationship;
import static com.csiro.snomio.util.SnowstormDtoUtil.toSnowstormConceptMini;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormConceptView;
import au.csiro.snowstorm_client.model.SnowstormConcreteValue.DataTypeEnum;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import com.csiro.snomio.exception.EmptyProductCreationProblem;
import com.csiro.snomio.exception.MoreThanOneSubjectProblem;
import com.csiro.snomio.exception.ProductAtomicDataValidationProblem;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.snomio.exception.SingleConceptExpectedProblem;
import com.csiro.snomio.product.Edge;
import com.csiro.snomio.product.FsnAndPt;
import com.csiro.snomio.product.NameGeneratorSpec;
import com.csiro.snomio.product.NewConceptDetails;
import com.csiro.snomio.product.Node;
import com.csiro.snomio.product.ProductCreationDetails;
import com.csiro.snomio.product.ProductSummary;
import com.csiro.snomio.product.details.ExternalIdentifier;
import com.csiro.snomio.product.details.Ingredient;
import com.csiro.snomio.product.details.MedicationProductDetails;
import com.csiro.snomio.product.details.PackageDetails;
import com.csiro.snomio.product.details.PackageQuantity;
import com.csiro.snomio.product.details.ProductQuantity;
import com.csiro.snomio.product.details.Quantity;
import com.csiro.snomio.util.*;
import com.csiro.tickets.controllers.dto.ProductDto;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.service.TicketService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Set;
import java.util.logging.Level;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@Log
public class MedicationCreationService {

  SnowstormClient snowstormClient;
  NameGenerationService nameGenerationService;
  TicketService ticketService;

  OwlAxiomService owlAxiomService;
  ObjectMapper objectMapper;

  @Autowired
  public MedicationCreationService(
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

  private static Set<SnowstormReferenceSetMemberViewComponent>
      getExternalIdentifierReferenceSetEntries(
          PackageDetails<MedicationProductDetails> packageDetails) {
    Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers = new HashSet<>();
    for (ExternalIdentifier identifier : packageDetails.getExternalIdentifiers()) {
      if (identifier.getIdentifierScheme().equals(ARTGID_SCHEME.getValue())) {
        referenceSetMembers.add(
            new SnowstormReferenceSetMemberViewComponent()
                .active(true)
                .moduleId(SCT_AU_MODULE.getValue())
                .refsetId(ARTGID_REFSET.getValue())
                .additionalFields(Map.of("mapTarget", identifier.getIdentifierValue())));
      } else {
        throw new ProductAtomicDataValidationProblem(
            "Unknown identifier scheme " + identifier.getIdentifierScheme());
      }
    }
    return referenceSetMembers;
  }

  private static Node getSubject(ProductSummary productSummary) {
    Set<Node> subjectNodes =
        productSummary.getNodes().stream()
            .filter(
                n ->
                    n.getLabel().equals(CTPP_LABEL)
                        && productSummary.getEdges().stream()
                            .noneMatch(e -> e.getTarget().equals(n.getConceptId())))
            .collect(Collectors.toSet());

    if (subjectNodes.size() != 1) {
      throw new MoreThanOneSubjectProblem(
          "Product model must have exactly one CTPP node (root) with no incoming edges. Found "
              + subjectNodes.size()
              + " which were "
              + subjectNodes.stream().map(Node::getConceptId).collect(Collectors.joining(", ")));
    }

    return subjectNodes.iterator().next();
  }

  public static BigDecimal calculateTotal(BigDecimal numerator, BigDecimal quantity) {
    BigDecimal result =
        numerator
            .multiply(quantity, new MathContext(10, RoundingMode.HALF_UP))
            .stripTrailingZeros();

    // Check if the decimal part is greater than 0.999
    if ((result.remainder(BigDecimal.ONE).compareTo(new BigDecimal("0.999")) >= 0
            && isWithinRoundingPercentage(result, 0, "0.01"))
        || result.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) == 0) {

      // Round to a whole number
      result = result.setScale(0, RoundingMode.HALF_UP).stripTrailingZeros();
    } else {
      BigDecimal rounded = result.setScale(6, RoundingMode.HALF_UP).stripTrailingZeros();

      if (isWithinRoundingPercentage(result, 6, "0.01")) {
        result = rounded;
      } else {
        throw new ProductAtomicDataValidationProblem(
            "Result of "
                + numerator
                + "*"
                + quantity
                + " = "
                + result
                + " which cannot be rounded to 6 decimal places within 1%.");
      }
    }

    return result;
  }

  private static boolean isWithinRoundingPercentage(
      BigDecimal result, int newScale, String percentage) {
    BigDecimal rounded = result.setScale(newScale, RoundingMode.HALF_UP);
    BigDecimal changePercentage =
        rounded.subtract(result).abs().divide(result, 10, RoundingMode.HALF_UP);

    return changePercentage.compareTo(new BigDecimal(percentage)) <= 0;
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
      @Valid ProductCreationDetails<@Valid MedicationProductDetails> productCreationDetails) {

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
              node.getConceptOptions().clear();
              if (node.getConcept() != null) {
                node.setNewConceptDetails(null);
              }
            });

    Node subject = getSubject(productSummary);

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

    productSummary.setSubject(subject.getConcept());

    ProductDto productDto =
        ProductDto.builder()
            .conceptId(Long.parseLong(productSummary.getSubject().getConceptId()))
            .packageDetails(productCreationDetails.getPackageDetails())
            .name(productSummary.getSubject().getFsn().getTerm())
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
    SnowstormConceptView concept = toSnowstormConceptView(node);

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

  private SnowstormConceptView toSnowstormConceptView(Node node) {
    SnowstormConceptView concept = new SnowstormConceptView();

    if (node.getNewConceptDetails().getConceptId() != null) {
      concept.setConceptId(node.getNewConceptDetails().getConceptId().toString());
    }
    concept.setModuleId(SCT_AU_MODULE.getValue());

    NewConceptDetails newConceptDetails = node.getNewConceptDetails();

    SnowstormDtoUtil.addDescription(
        concept, newConceptDetails.getPreferredTerm(), SnomedConstants.SYNONYM.getValue());
    SnowstormDtoUtil.addDescription(
        concept, newConceptDetails.getFullySpecifiedName(), SnomedConstants.FSN.getValue());

    concept.setActive(true);
    concept.setDefinitionStatusId(
        newConceptDetails.getAxioms().stream()
                .anyMatch(a -> a.getDefinitionStatus().equals(DEFINED.getValue()))
            ? DEFINED.getValue()
            : PRIMITIVE.getValue());
    concept.setClassAxioms(newConceptDetails.getAxioms());

    concept.setConceptId(newConceptDetails.getSpecifiedConceptId());
    if (concept.getConceptId() == null) {
      concept.setConceptId(newConceptDetails.getConceptId().toString());
    }
    return concept;
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

  /**
   * Calculates the existing and new products required to create a product based on the product
   * details.
   *
   * @param branch branch to lookup concepts in
   * @param packageDetails details of the product to create
   * @return ProductSummary representing the existing and new concepts required to create this
   *     product
   */
  public ProductSummary calculateProductFromAtomicData(
      String branch, PackageDetails<MedicationProductDetails> packageDetails) {
    return calculateCreatePackage(
        branch,
        packageDetails,
        new AtomicCache(
            packageDetails.getIdFsnMap(), AmtConstants.values(), SnomedConstants.values()));
  }

  private ProductSummary calculateCreatePackage(
      String branch,
      PackageDetails<MedicationProductDetails> packageDetails,
      AtomicCache atomicCache) {
    ProductSummary productSummary = new ProductSummary();

    validatePackageDetails(packageDetails);

    Map<PackageQuantity<MedicationProductDetails>, ProductSummary> innerPackageSummaries =
        new HashMap<>();
    for (PackageQuantity<MedicationProductDetails> packageQuantity :
        packageDetails.getContainedPackages()) {
      validatePackageQuantity(packageQuantity);
      ProductSummary innerPackageSummary =
          calculateCreatePackage(branch, packageQuantity.getPackageDetails(), atomicCache);
      innerPackageSummaries.put(packageQuantity, innerPackageSummary);
    }

    Map<ProductQuantity<MedicationProductDetails>, ProductSummary> innnerProductSummaries =
        new HashMap<>();
    for (ProductQuantity<MedicationProductDetails> productQuantity :
        packageDetails.getContainedProducts()) {
      validateProductQuantity(branch, productQuantity);
      ProductSummary innerProductSummary =
          createProduct(
              branch,
              productQuantity.getProductDetails(),
              atomicCache,
              packageDetails.getSelectedConceptIdentifiers());
      innnerProductSummaries.put(productQuantity, innerProductSummary);
    }

    Node mpp =
        getOrCreatePackagedClinicalDrug(
            branch,
            packageDetails,
            innerPackageSummaries,
            innnerProductSummaries,
            null,
            false,
            false,
            atomicCache);
    productSummary.addNode(mpp);

    Node tpp =
        getOrCreatePackagedClinicalDrug(
            branch,
            packageDetails,
            innerPackageSummaries,
            innnerProductSummaries,
            mpp,
            true,
            false,
            atomicCache);
    productSummary.addNode(tpp);
    productSummary.addEdge(tpp.getConceptId(), mpp.getConceptId(), IS_A_LABEL);

    Node ctpp =
        getOrCreatePackagedClinicalDrug(
            branch,
            packageDetails,
            innerPackageSummaries,
            innnerProductSummaries,
            tpp,
            true,
            true,
            atomicCache);
    productSummary.addNode(ctpp);
    productSummary.addEdge(ctpp.getConceptId(), tpp.getConceptId(), IS_A_LABEL);

    productSummary.setSubject(ctpp.toConceptMini());

    productSummary.addNode(packageDetails.getProductName(), TP_LABEL);
    productSummary.addEdge(
        tpp.getConceptId(), packageDetails.getProductName().getConceptId(), HAS_PRODUCT_NAME_LABEL);
    productSummary.addEdge(
        ctpp.getConceptId(),
        packageDetails.getProductName().getConceptId(),
        HAS_PRODUCT_NAME_LABEL);

    for (ProductSummary summary : innerPackageSummaries.values()) {
      productSummary.addSummary(summary);
      productSummary.addEdge(
          ctpp.getConceptId(), summary.getSubject().getConceptId(), CONTAINS_LABEL);
      productSummary.addEdge(
          tpp.getConceptId(), summary.getSingleConceptWithLabel(TPP_LABEL), CONTAINS_LABEL);
      productSummary.addEdge(
          mpp.getConceptId(), summary.getSingleConceptWithLabel(MPP_LABEL), CONTAINS_LABEL);
    }

    for (ProductSummary summary : innnerProductSummaries.values()) {
      productSummary.addSummary(summary);
      productSummary.addEdge(
          ctpp.getConceptId(), summary.getSubject().getConceptId(), CONTAINS_LABEL);
      productSummary.addEdge(
          tpp.getConceptId(), summary.getSubject().getConceptId(), CONTAINS_LABEL);
      productSummary.addEdge(
          mpp.getConceptId(), summary.getSingleConceptWithLabel(MPUU_LABEL), CONTAINS_LABEL);
    }

    Set<Edge> transitiveContainsEdges =
        ProductService.getTransitiveEdges(productSummary, new HashSet<>());
    productSummary.getEdges().addAll(transitiveContainsEdges);

    return productSummary;
  }

  private Node getOrCreatePackagedClinicalDrug(
      String branch,
      PackageDetails<MedicationProductDetails> packageDetails,
      Map<PackageQuantity<MedicationProductDetails>, ProductSummary> innerPackageSummaries,
      Map<ProductQuantity<MedicationProductDetails>, ProductSummary> innnerProductSummaries,
      Node parent,
      boolean branded,
      boolean container,
      AtomicCache atomicCache) {

    String semanticTag;
    String label;
    Set<String> refsets;
    final Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers =
        branded && container ? getExternalIdentifierReferenceSetEntries(packageDetails) : Set.of();
    if (branded) {
      if (container) {
        label = CTPP_LABEL;
        semanticTag = CONTAINERIZED_BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG.getValue();
        refsets = Set.of(CTPP_REFSET_ID.getValue());
      } else {
        label = TPP_LABEL;
        semanticTag = BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG.getValue();
        refsets = Set.of(TPP_REFSET_ID.getValue());
      }
    } else {
      label = MPP_LABEL;
      semanticTag = CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG.getValue();
      refsets = Set.of(MPP_REFSET_ID.getValue());
    }

    Set<SnowstormRelationship> relationships =
        createPackagedClinicalDrugRelationships(
            packageDetails,
            innerPackageSummaries,
            innnerProductSummaries,
            parent,
            branded,
            container);

    return generateNode(
        branch,
        atomicCache,
        relationships,
        refsets,
        label,
        referenceSetMembers,
        semanticTag,
        packageDetails.getSelectedConceptIdentifiers());
  }

  private Node generateNode(
      String branch,
      AtomicCache atomicCache,
      Set<SnowstormRelationship> relationships,
      Set<String> refsets,
      String label,
      Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers,
      String semanticTag,
      List<String> selectedConceptIdentifiers) {

    boolean selectedConcept = false; // indicates if a selected concept has been detected
    Node node = new Node();
    node.setLabel(label);

    // if the relationships are empty or a relationship to a new concept (-ve id)
    // then don't bother looking
    if (!relationships.isEmpty()
        && relationships.stream()
            .noneMatch(r -> !r.getConcrete() && Long.parseLong(r.getDestinationId()) < 0)) {
      String ecl = EclBuilder.build(relationships, refsets);
      Collection<SnowstormConceptMini> matchingConcepts =
          snowstormClient.getConceptsFromEcl(branch, ecl, 10);

      matchingConcepts = filterByOii(branch, relationships, matchingConcepts);

      if (matchingConcepts.isEmpty()) {
        log.warning("No concept found for ECL " + ecl);
      } else if (matchingConcepts.size() == 1
          && matchingConcepts.iterator().next().getDefinitionStatus().equals("FULLY_DEFINED")) {
        node.setConcept(matchingConcepts.iterator().next());
        atomicCache.addFsn(node.getConceptId(), node.getFullySpecifiedName());
      } else {
        node.setConceptOptions(matchingConcepts);
        Set<SnowstormConceptMini> selectedConcepts =
            matchingConcepts.stream()
                .filter(c -> selectedConceptIdentifiers.contains(c.getConceptId()))
                .collect(Collectors.toSet());

        if (!selectedConcepts.isEmpty()) {
          if (selectedConcepts.size() > 1) {
            throw new SingleConceptExpectedProblem(
                selectedConcepts,
                " Multiple matches for selected concept identifiers "
                    + selectedConceptIdentifiers.stream().collect(Collectors.joining()));
          }
          node.setConcept(selectedConcepts.iterator().next());
          selectedConcept = true;
        }
      }
    }

    // if there is no single matching concept found, or the user has selected a single concept
    // provide the modelling for a new concept so they can select a new concept as an option.
    if (node.getConcept() == null || selectedConcept) {
      node.setLabel(label);
      NewConceptDetails newConceptDetails = new NewConceptDetails(atomicCache.getNextId());
      SnowstormAxiom axiom = new SnowstormAxiom();
      axiom.active(true);
      axiom.setDefinitionStatus(
          node.getConceptOptions().isEmpty() ? DEFINED.getValue() : PRIMITIVE.getValue());
      axiom.setRelationships(relationships);
      newConceptDetails.setSemanticTag(semanticTag);
      node.setNewConceptDetails(newConceptDetails);
      newConceptDetails.getAxioms().add(axiom);
      newConceptDetails.setReferenceSetMembers(referenceSetMembers);
      SnowstormConceptView scon = toSnowstormConceptView(node);
      Set<String> axioms = owlAxiomService.translate(scon);
      String axiomN;
      try {
        if (axioms == null || axioms.size() != 1) {
          throw new NoSuchElementException();
        }
        axiomN = axioms.stream().findFirst().orElseThrow();
      } catch (NoSuchElementException e) {
        throw new ProductAtomicDataValidationProblem(
            "Could not calculate one (and only one) axiom for concept " + scon.getConceptId());
      }
      axiomN = substituteIdsInAxiom(axiomN, atomicCache, newConceptDetails.getConceptId());

      FsnAndPt fsnAndPt =
          nameGenerationService.createFsnAndPreferredTerm(
              new NameGeneratorSpec(semanticTag, axiomN));

      newConceptDetails.setFullySpecifiedName(fsnAndPt.getFSN());
      newConceptDetails.setPreferredTerm(fsnAndPt.getPT());
      atomicCache.addFsn(node.getConceptId(), fsnAndPt.getFSN());
    }

    return node;
  }

  /**
   * Post filters a set of concept to remove those that don't match the OII required by the set of
   * candidate relationships - this is because Snowstorm does not support String type concrete
   * domains in ECL so this is a work around.
   *
   * @param branch
   * @param relationships original candidate relationships to check the concepts against
   * @param matchingConcepts matching concepts to filter that matched the ECL
   * @return filtered down set of matching concepts removing any concepts that don't match the OII
   */
  private Collection<SnowstormConceptMini> filterByOii(
      String branch,
      Set<SnowstormRelationship> relationships,
      Collection<SnowstormConceptMini> matchingConcepts) {
    if (relationships.stream()
        .anyMatch(r -> r.getTypeId().equals(HAS_OTHER_IDENTIFYING_INFORMATION.getValue()))) {
      List<String> oii =
          relationships.stream()
              .filter(r -> r.getTypeId().equals(HAS_OTHER_IDENTIFYING_INFORMATION.getValue()))
              .map(r -> r.getConcreteValue().getValue())
              .toList();

      List<String> idsWithMatchingOii =
          matchingConcepts.stream()
              .map(
                  c ->
                      snowstormClient.getRelationships(branch, c.getConceptId()).block().getItems())
              .flatMap(Collection::stream)
              .filter(
                  r ->
                      r.getTypeId().equals(HAS_OTHER_IDENTIFYING_INFORMATION.getValue())
                          && oii.contains(r.getConcreteValue().getValue()))
              .map(r -> r.getSourceId())
              .toList();

      matchingConcepts =
          matchingConcepts.stream()
              .filter(c -> idsWithMatchingOii.contains(c.getConceptId()))
              .toList();
    }
    return matchingConcepts;
  }

  private Set<SnowstormRelationship> createPackagedClinicalDrugRelationships(
      PackageDetails<MedicationProductDetails> packageDetails,
      Map<PackageQuantity<MedicationProductDetails>, ProductSummary> innerPackageSummaries,
      Map<ProductQuantity<MedicationProductDetails>, ProductSummary> innnerProductSummaries,
      Node parent,
      boolean branded,
      boolean container) {

    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(
        getSnowstormRelationship(IS_A.getValue(), MEDICINAL_PRODUCT_PACKAGE.getValue(), 0));
    if (parent != null) {
      relationships.add(getSnowstormRelationship(IS_A.getValue(), parent.getConceptId(), 0));
    }

    if (branded && container) {
      addRelationshipIfNotNull(
          relationships, packageDetails.getContainerType(), HAS_CONTAINER_TYPE.getValue(), 0);
    }

    if (branded) {
      addRelationshipIfNotNull(
          relationships, packageDetails.getProductName(), HAS_PRODUCT_NAME.getValue(), 0);
    }

    int group = 1;
    for (Entry<ProductQuantity<MedicationProductDetails>, ProductSummary> entry :
        innnerProductSummaries.entrySet()) {
      String containedId;
      ProductSummary productSummary = entry.getValue();
      if (branded) {
        containedId = productSummary.getSubject().getConceptId();
      } else {
        containedId = productSummary.getSingleConceptWithLabel(MPUU_LABEL);
      }
      relationships.add(getSnowstormRelationship(CONTAINS_CD.getValue(), containedId, group));

      ProductQuantity<MedicationProductDetails> quantity = entry.getKey();
      relationships.add(
          getSnowstormRelationship(
              HAS_PACK_SIZE_UNIT.getValue(), quantity.getUnit().getConceptId(), group));
      relationships.add(
          getSnowstormDatatypeComponent(
              HAS_PACK_SIZE_VALUE.getValue(),
              quantity.getValue().toString(),
              DataTypeEnum.DECIMAL,
              group));

      relationships.add(
          getSnowstormDatatypeComponent(
              COUNT_OF_CONTAINED_COMPONENT_INGREDIENT.getValue(),
              // get the unique set of active ingredients
              Integer.toString(
                  quantity.getProductDetails().getActiveIngredients().stream()
                      .map(i -> i.getActiveIngredient().getConceptId())
                      .collect(Collectors.toSet())
                      .size()),
              DataTypeEnum.INTEGER,
              group));

      group++;
    }

    for (Entry<PackageQuantity<MedicationProductDetails>, ProductSummary> entry :
        innerPackageSummaries.entrySet()) {
      String containedId;
      ProductSummary productSummary = entry.getValue();
      if (branded && container) {
        containedId = productSummary.getSubject().getConceptId();
      } else if (branded) {
        containedId = productSummary.getSingleConceptWithLabel(TPP_LABEL);
      } else {
        containedId = productSummary.getSingleConceptWithLabel(MPP_LABEL);
      }
      relationships.add(
          getSnowstormRelationship(CONTAINS_PACKAGED_CD.getValue(), containedId, group));

      PackageQuantity<MedicationProductDetails> quantity = entry.getKey();
      relationships.add(
          getSnowstormRelationship(
              HAS_PACK_SIZE_UNIT.getValue(), quantity.getUnit().getConceptId(), group));
      relationships.add(
          getSnowstormDatatypeComponent(
              HAS_PACK_SIZE_VALUE.getValue(),
              quantity.getValue().toString(),
              DataTypeEnum.DECIMAL,
              group));
      group++;
    }

    if (!innerPackageSummaries.isEmpty()) {
      relationships.add(
          getSnowstormDatatypeComponent(
              COUNT_OF_CONTAINED_PACKAGE_TYPE.getValue(),
              // get the unique set of active ingredients
              Integer.toString(
                  innerPackageSummaries.values().stream()
                      .map(v -> v.getSubject().getConceptId())
                      .collect(Collectors.toSet())
                      .size()),
              DataTypeEnum.INTEGER,
              0));
    }

    return relationships;
  }

  private ProductSummary createProduct(
      String branch,
      MedicationProductDetails productDetails,
      AtomicCache atomicCache,
      List<String> selectedConceptIdentifiers) {
    ProductSummary productSummary = new ProductSummary();

    Node mp =
        findOrCreateMp(
            branch, productDetails, productSummary, atomicCache, selectedConceptIdentifiers);
    Node mpuu =
        findOrCreateUnit(
            branch,
            productDetails,
            mp,
            productSummary,
            false,
            atomicCache,
            selectedConceptIdentifiers);
    Node tpuu =
        findOrCreateUnit(
            branch,
            productDetails,
            mpuu,
            productSummary,
            true,
            atomicCache,
            selectedConceptIdentifiers);

    productSummary.addNode(productDetails.getProductName(), TP_LABEL);
    productSummary.addEdge(
        tpuu.getConceptId(),
        productDetails.getProductName().getConceptId(),
        HAS_PRODUCT_NAME_LABEL);

    productSummary.setSubject(tpuu.toConceptMini());

    return productSummary;
  }

  private Node findOrCreateUnit(
      String branch,
      MedicationProductDetails productDetails,
      Node parent,
      ProductSummary productSummary,
      boolean branded,
      AtomicCache atomicCache,
      List<String> selectedConceptIdentifiers) {
    String label = branded ? TPUU_LABEL : MPUU_LABEL;
    Set<String> referencedIds =
        Set.of(branded ? TPUU_REFSET_ID.getValue() : MPUU_REFSET_ID.getValue());
    String semanticTag =
        branded
            ? BRANDED_CLINICAL_DRUG_SEMANTIC_TAG.getValue()
            : CLINICAL_DRUG_SEMANTIC_TAG.getValue();

    Set<SnowstormRelationship> relationships =
        createClinicalDrugRelationships(productDetails, parent, branded);

    Node node =
        generateNode(
            branch,
            atomicCache,
            relationships,
            referencedIds,
            label,
            null,
            semanticTag,
            selectedConceptIdentifiers);
    productSummary.addNode(node);
    productSummary.addEdge(node.getConceptId(), parent.getConceptId(), IS_A_LABEL);
    return node;
  }

  private Node findOrCreateMp(
      String branch,
      MedicationProductDetails details,
      ProductSummary productSummary,
      AtomicCache atomicCache,
      List<String> selectedConceptIdentifiers) {
    Set<SnowstormRelationship> relationships = createMpRelationships(details);
    Node mp =
        generateNode(
            branch,
            atomicCache,
            relationships,
            Set.of(MP_REFSET_ID.getValue()),
            MP_LABEL,
            null,
            MEDICINAL_PRODUCT_SEMANTIC_TAG.getValue(),
            selectedConceptIdentifiers);

    productSummary.addNode(mp);
    return mp;
  }

  private Set<SnowstormRelationship> createClinicalDrugRelationships(
      MedicationProductDetails productDetails, Node mp, boolean branded) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A.getValue(), MEDICINAL_PRODUCT.getValue(), 0));
    relationships.add(getSnowstormRelationship(IS_A.getValue(), mp.getConceptId(), 0));

    if (branded) {
      relationships.add(
          getSnowstormRelationship(
              HAS_PRODUCT_NAME.getValue(), productDetails.getProductName().getConceptId(), 0));

      relationships.add(
          getSnowstormDatatypeComponent(
              HAS_OTHER_IDENTIFYING_INFORMATION.getValue(),
              !StringUtils.hasLength(productDetails.getOtherIdentifyingInformation())
                  ? "None"
                  : productDetails.getOtherIdentifyingInformation(),
              DataTypeEnum.STRING,
              0));
    }

    addRelationshipIfNotNull(
        relationships, productDetails.getContainerType(), HAS_CONTAINER_TYPE.getValue(), 0);
    addRelationshipIfNotNull(
        relationships, productDetails.getDeviceType(), HAS_DEVICE_TYPE.getValue(), 0);

    String doseFormId =
        productDetails.getGenericForm() == null
            ? null
            : productDetails.getGenericForm().getConceptId();

    if (branded) {
      doseFormId =
          productDetails.getSpecificForm() == null
              ? doseFormId
              : productDetails.getSpecificForm().getConceptId();
    }

    if (doseFormId != null) {
      relationships.add(
          getSnowstormRelationship(HAS_MANUFACTURED_DOSE_FORM.getValue(), doseFormId, 0));
    }

    addQuantityIfNotNull(
        productDetails.getQuantity(),
        relationships,
        HAS_PACK_SIZE_VALUE.getValue(),
        HAS_PACK_SIZE_UNIT.getValue(),
        DataTypeEnum.DECIMAL,
        0);

    int group = 1;
    for (Ingredient ingredient : productDetails.getActiveIngredients()) {
      addRelationshipIfNotNull(
          relationships, ingredient.getActiveIngredient(), HAS_ACTIVE_INGREDIENT.getValue(), group);
      addRelationshipIfNotNull(
          relationships,
          ingredient.getPreciseIngredient(),
          HAS_PRECISE_ACTIVE_INGREDIENT.getValue(),
          group);
      addRelationshipIfNotNull(
          relationships, ingredient.getBasisOfStrengthSubstance(), HAS_BOSS.getValue(), group);
      addQuantityIfNotNull(
          ingredient.getTotalQuantity(),
          relationships,
          HAS_TOTAL_QUANTITY_VALUE.getValue(),
          HAS_TOTAL_QUANTITY_UNIT.getValue(),
          DataTypeEnum.DECIMAL,
          group);
      addQuantityIfNotNull(
          ingredient.getConcentrationStrength(),
          relationships,
          CONCENTRATION_STRENGTH_VALUE.getValue(),
          CONCENTRATION_STRENGTH_UNIT.getValue(),
          DataTypeEnum.DECIMAL,
          group);
      group++;
    }

    // MPUUs/CDs use "some" semantics, TPUUs/BCDs use "only" semantics
    if (branded
        && productDetails.getActiveIngredients() != null
        && !productDetails.getActiveIngredients().isEmpty()) {
      relationships.add(
          getSnowstormDatatypeComponent(
              COUNT_OF_ACTIVE_INGREDIENT.getValue(),
              // get the unique set of active ingredients
              Integer.toString(
                  productDetails.getActiveIngredients().stream()
                      .map(i -> i.getActiveIngredient().getConceptId())
                      .collect(Collectors.toSet())
                      .size()),
              DataTypeEnum.INTEGER,
              0));
    }

    return relationships;
  }

  private Set<SnowstormRelationship> createMpRelationships(
      MedicationProductDetails productDetails) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A.getValue(), MEDICINAL_PRODUCT.getValue(), 0));
    int group = 1;
    for (Ingredient ingredient : productDetails.getActiveIngredients()) {
      relationships.add(
          getSnowstormRelationship(
              HAS_ACTIVE_INGREDIENT.getValue(),
              ingredient.getActiveIngredient().getConceptId(),
              group));
      group++;
    }
    return relationships;
  }

  private boolean isIntegerValue(BigDecimal bd) {
    return bd.stripTrailingZeros().scale() <= 0;
  }

  private void validateProductQuantity(
      String branch, ProductQuantity<MedicationProductDetails> productQuantity) {
    // Leave the MRCM validation to the MRCM - the UI should already enforce this and the validation
    // in the MS will catch it. Validating here will just slow things down.
    validateQuantityValueIsOneIfUnitIsEach(productQuantity);

    // if the contained product has a container/device type or a quantity then the unit must be
    // each and the quantity must be an integer
    MedicationProductDetails productDetails = productQuantity.getProductDetails();
    Quantity productDetailsQuantity = productDetails.getQuantity();
    if ((productDetails.getContainerType() != null
            || productDetails.getDeviceType() != null
            || productDetailsQuantity != null)
        && (!productQuantity.getUnit().getConceptId().equals(UNIT_OF_PRESENTATION.getValue())
            || !isIntegerValue(productQuantity.getValue()))) {
      throw new ProductAtomicDataValidationProblem(
          "Product quantity must be a positive whole number and unit each if a container type or device type are specified");
    }

    // -- for each ingredient
    // --- total quantity unit if present must not be composite
    // --- concentration strength if present must be composite unit
    for (Ingredient ingredient : productDetails.getActiveIngredients()) {
      if (ingredient.getTotalQuantity() != null
          && snowstormClient.isCompositeUnit(branch, ingredient.getTotalQuantity().getUnit())) {
        throw new ProductAtomicDataValidationProblem(
            "Total quantity unit must not be composite. Ingredient was "
                + getIdAndFsnTerm(ingredient.getActiveIngredient())
                + " with unit "
                + getIdAndFsnTerm(ingredient.getTotalQuantity().getUnit()));
      }

      if (ingredient.getConcentrationStrength() != null
          && !snowstormClient.isCompositeUnit(
              branch, ingredient.getConcentrationStrength().getUnit())) {
        throw new ProductAtomicDataValidationProblem(
            "Concentration strength unit must be composite. Ingredient was "
                + getIdAndFsnTerm(ingredient.getActiveIngredient())
                + " with unit "
                + getIdAndFsnTerm(ingredient.getConcentrationStrength().getUnit()));
      }

      if (productDetailsQuantity != null
          && productDetailsQuantity.getUnit() != null
          && ingredient.getTotalQuantity() != null
          && ingredient.getConcentrationStrength() == null) {
        throw new ProductAtomicDataValidationProblem(
            "Product quantity and total ingredient quantity specified for ingredient "
                + getIdAndFsnTerm(ingredient.getActiveIngredient())
                + " but concentration strength not specified. "
                + "0, 1, or all 3 of these properties must be populated, populating 2 is not valid.");
      } else if (productDetailsQuantity != null
          && productDetailsQuantity.getUnit() != null
          && ingredient.getTotalQuantity() == null
          && ingredient.getConcentrationStrength() != null) {
        throw new ProductAtomicDataValidationProblem(
            "Product quantity and concentration strength specified for ingredient "
                + getIdAndFsnTerm(ingredient.getActiveIngredient())
                + " but total ingredient quantity not specified. "
                + "0, 1, or all 3 of these properties must be populated, populating 2 is not valid.");
      } else if ((productDetailsQuantity == null || productDetailsQuantity.getUnit() == null)
          && ingredient.getTotalQuantity() != null
          && ingredient.getConcentrationStrength() != null) {
        throw new ProductAtomicDataValidationProblem(
            "Total ingredient quantity and concentration strength specified for ingredient "
                + getIdAndFsnTerm(ingredient.getActiveIngredient())
                + " but product quantity not specified. "
                + "0, 1, or all 3 of these properties must be populated, populating 2 is not valid.");
      } else if (productDetailsQuantity != null
          && productDetailsQuantity.getUnit() != null
          && ingredient.getTotalQuantity() != null
          && ingredient.getConcentrationStrength() != null) {
        // validate that the units line up
        Pair<SnowstormConceptMini, SnowstormConceptMini> numeratorAndDenominator =
            getNumeratorAndDenominatorUnit(
                branch, ingredient.getConcentrationStrength().getUnit().getConceptId());

        if (!ingredient
            .getTotalQuantity()
            .getUnit()
            .getConceptId()
            .equals(numeratorAndDenominator.getFirst().getConceptId())) {
          throw new ProductAtomicDataValidationProblem(
              "Ingredient "
                  + getIdAndFsnTerm(ingredient.getActiveIngredient())
                  + " total quantity unit "
                  + getIdAndFsnTerm(ingredient.getTotalQuantity().getUnit())
                  + " does not match the concetration strength numerator "
                  + getIdAndFsnTerm(numeratorAndDenominator.getFirst())
                  + " as expected");
        }

        if (!productDetailsQuantity
            .getUnit()
            .getConceptId()
            .equals(numeratorAndDenominator.getSecond().getConceptId())) {
          throw new ProductAtomicDataValidationProblem(
              "Product quantity unit "
                  + getIdAndFsnTerm(productDetailsQuantity.getUnit())
                  + " does not match ingredient "
                  + getIdAndFsnTerm(ingredient.getActiveIngredient())
                  + " concetration strength denominator "
                  + getIdAndFsnTerm(numeratorAndDenominator.getSecond())
                  + " as expected");
        }

        // validate that the values calculate out correctly
        BigDecimal totalQuantity = ingredient.getTotalQuantity().getValue();
        BigDecimal concentration = ingredient.getConcentrationStrength().getValue();
        BigDecimal quantity = productDetailsQuantity.getValue();

        BigDecimal calculatedTotalQuantity = calculateTotal(concentration, quantity);

        if (!totalQuantity.stripTrailingZeros().equals(calculatedTotalQuantity)) {
          throw new ProductAtomicDataValidationProblem(
              "Total quantity "
                  + totalQuantity
                  + " for ingredient "
                  + getIdAndFsnTerm(ingredient.getActiveIngredient())
                  + " does not match calculated value "
                  + calculatedTotalQuantity
                  + " from the provided concentration and product quantity");
        }
      }
    }
  }

  private Pair<SnowstormConceptMini, SnowstormConceptMini> getNumeratorAndDenominatorUnit(
      String branch, String unit) {
    List<SnowstormRelationship> relationships =
        snowstormClient.getRelationships(branch, unit).block().getItems();

    List<SnowstormConceptMini> numerators =
        relationships.stream()
            .filter(r -> r.getTypeId().equals(AmtConstants.HAS_NUMERATOR_UNIT.getValue()))
            .map(r -> r.getTarget())
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
            .map(r -> r.getTarget())
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

  private String getIdAndFsnTerm(SnowstormConceptMini component) {
    return component.getConceptId()
        + "|"
        + Objects.requireNonNull(component.getFsn()).getTerm()
        + "|";
  }

  private String substituteIdsInAxiom(
      String axiom, AtomicCache atomicCache, @NotNull Integer conceptId) {
    for (String id : atomicCache.getFsnIds()) {
      axiom = substituteIdInAxiom(axiom, id, atomicCache.getFsn(id));
    }
    axiom = substituteIdInAxiom(axiom, conceptId.toString(), "");

    return axiom;
  }

  private String substituteIdInAxiom(String axiom, String id, String replacement) {
    return axiom
        .replaceAll(
            "(<http://snomed\\.info/id/" + id + ">|: *'?" + id + "'?)", ":'" + replacement + "'")
        .replaceAll("''", "");
  }

  private void validatePackageQuantity(PackageQuantity<MedicationProductDetails> packageQuantity) {
    // Leave the MRCM validation to the MRCM - the UI should already enforce this and the validation
    // in the MS will catch it. Validating here will just slow things down.

    // -- package quantity unit must be each and the quantitiy must be an integer
    validateQuantityValueIsOneIfUnitIsEach(packageQuantity);

    // validate that the package is only nested one deep
    if (packageQuantity.getPackageDetails().getContainedPackages() != null
        && !packageQuantity.getPackageDetails().getContainedPackages().isEmpty()) {
      throw new ProductAtomicDataValidationProblem(
          "A contained package must not contain further packages - nesting is only one level deep");
    }
  }

  private void validateQuantityValueIsOneIfUnitIsEach(Quantity quantity) {
    if (Objects.requireNonNull(quantity.getUnit().getConceptId())
            .equals(UNIT_OF_PRESENTATION.getValue())
        && !isIntegerValue(quantity.getValue())) {
      throw new ProductAtomicDataValidationProblem(
          "Quantity must be an integer if the unit is 'each', unit was "
              + getIdAndFsnTerm(quantity.getUnit()));
    }
  }

  private void validatePackageDetails(PackageDetails<MedicationProductDetails> packageDetails) {
    // Leave the MRCM validation to the MRCM - the UI should already enforce this and the validation
    // in the MS will catch it. Validating here will just slow things down.

    // validate the package details
    // - product name is a product name - MRCM?
    // - container type is a container type - MRCM?
  }
}
