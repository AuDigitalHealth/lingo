package com.csiro.snomio.service;

import static com.csiro.snomio.service.ProductSummaryService.CONTAINS_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.CTPP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.HAS_PRODUCT_NAME_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.IS_A_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.MPP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.MPUU_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.MP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.TPP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.TPUU_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.TP_LABEL;
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
import static com.csiro.snomio.util.AmtConstants.TPP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.TPUU_REFSET_ID;
import static com.csiro.snomio.util.RelationshipSorter.sortRelationships;
import static com.csiro.snomio.util.SnomedConstants.BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.BRANDED_CLINICAL_DRUG_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.BRANDED_PRODUCT_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CLINICAL_DRUG_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CONTAINERIZED_BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CONTAINERIZED_BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CONTAINS_CD;
import static com.csiro.snomio.util.SnomedConstants.COUNT_OF_ACTIVE_INGREDIENT;
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
import static com.csiro.snomio.util.SnomedConstants.PRODUCT_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.PRODUCT_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.UNIT_OF_PRESENTATION;
import static com.csiro.snomio.util.SnowstormDtoUtil.addQuantityIfNotNull;
import static com.csiro.snomio.util.SnowstormDtoUtil.addRelationshipIfNotNull;
import static com.csiro.snomio.util.SnowstormDtoUtil.getIdAndFsnTerm;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSnowstormDatatypeComponent;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSnowstormRelationship;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormConceptView;
import au.csiro.snowstorm_client.model.SnowstormConcreteValue.DataTypeEnum;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import com.csiro.snomio.exception.ProductAtomicDataValidationProblem;
import com.csiro.snomio.product.Edge;
import com.csiro.snomio.product.FsnAndPt;
import com.csiro.snomio.product.NameGeneratorSpec;
import com.csiro.snomio.product.Node;
import com.csiro.snomio.product.ProductSummary;
import com.csiro.snomio.product.details.Ingredient;
import com.csiro.snomio.product.details.MedicationProductDetails;
import com.csiro.snomio.product.details.PackageDetails;
import com.csiro.snomio.product.details.PackageQuantity;
import com.csiro.snomio.product.details.ProductQuantity;
import com.csiro.snomio.product.details.Quantity;
import com.csiro.snomio.util.*;
import com.csiro.tickets.service.TicketService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@Log
public class MedicationProductCalculationService {

  SnowstormClient snowstormClient;
  NameGenerationService nameGenerationService;
  TicketService ticketService;

  OwlAxiomService owlAxiomService;
  ObjectMapper objectMapper;

  NodeGeneratorService nodeGeneratorService;

  @Autowired
  public MedicationProductCalculationService(
      SnowstormClient snowstormClient,
      NameGenerationService nameGenerationService,
      TicketService ticketService,
      OwlAxiomService owlAxiomService,
      ObjectMapper objectMapper,
      NodeGeneratorService nodeGeneratorService) {
    this.snowstormClient = snowstormClient;
    this.nameGenerationService = nameGenerationService;
    this.ticketService = ticketService;
    this.owlAxiomService = owlAxiomService;
    this.objectMapper = objectMapper;
    this.nodeGeneratorService = nodeGeneratorService;
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

  private static void addParent(Node mpuuNode, Node mpNode) {
    if (mpuuNode.isNewConcept()) {
      mpuuNode
          .getNewConceptDetails()
          .getAxioms()
          .forEach(
              a ->
                  a.getRelationships()
                      .add(getSnowstormRelationship(IS_A.getValue(), mpNode.getConceptId(), 0)));
    }
  }

  private static String getSemanticTag(
      boolean branded,
      boolean containerized,
      PackageDetails<MedicationProductDetails> packageDetails) {
    boolean device =
        packageDetails.getContainedPackages().stream()
                .anyMatch(
                    p ->
                        p.getPackageDetails().getContainedProducts().stream()
                            .anyMatch(
                                product -> product.getProductDetails().getDeviceType() != null))
            || packageDetails.getContainedProducts().stream()
                .anyMatch(product -> product.getProductDetails().getDeviceType() != null);

    if (branded && containerized && device) {
      return CONTAINERIZED_BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG.getValue();
    } else if (branded && containerized) {
      return CONTAINERIZED_BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG.getValue();
    } else if (branded && device) {
      return BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG.getValue();
    } else if (branded) {
      return BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG.getValue();
    } else if (device) {
      return PRODUCT_PACKAGE_SEMANTIC_TAG.getValue();
    } else {
      return CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG.getValue();
    }
  }

  private static String getSemanticTag(boolean branded, MedicationProductDetails productDetails) {
    boolean device = productDetails.getDeviceType() != null;
    if (branded && device) {
      return BRANDED_PRODUCT_SEMANTIC_TAG.getValue();
    } else if (branded) {
      return BRANDED_CLINICAL_DRUG_SEMANTIC_TAG.getValue();
    } else if (device) {
      return PRODUCT_SEMANTIC_TAG.getValue();
    } else {
      return CLINICAL_DRUG_SEMANTIC_TAG.getValue();
    }
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
      String branch, PackageDetails<MedicationProductDetails> packageDetails)
      throws ExecutionException, InterruptedException {
    return calculateCreatePackage(
        branch,
        packageDetails,
        new AtomicCache(
            packageDetails.getIdFsnMap(), AmtConstants.values(), SnomedConstants.values()));
  }

  private ProductSummary calculateCreatePackage(
      String branch,
      PackageDetails<MedicationProductDetails> packageDetails,
      AtomicCache atomicCache)
      throws ExecutionException, InterruptedException {
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

    CompletableFuture<Node> mpp =
        getOrCreatePackagedClinicalDrug(
                branch,
                packageDetails,
                innerPackageSummaries,
                innnerProductSummaries,
                false,
                false,
                atomicCache)
            .thenApply(
                n -> {
                  addGeneratedFsnAndPt(
                      atomicCache, getSemanticTag(false, false, packageDetails), n);
                  productSummary.addNode(n);
                  return n;
                });

    CompletableFuture<Node> tpp =
        getOrCreatePackagedClinicalDrug(
                branch,
                packageDetails,
                innerPackageSummaries,
                innnerProductSummaries,
                true,
                false,
                atomicCache)
            .thenApply(
                n -> {
                  addGeneratedFsnAndPt(atomicCache, getSemanticTag(true, false, packageDetails), n);
                  productSummary.addNode(n);
                  return n;
                });

    CompletableFuture<Node> ctpp =
        getOrCreatePackagedClinicalDrug(
                branch,
                packageDetails,
                innerPackageSummaries,
                innnerProductSummaries,
                true,
                true,
                atomicCache)
            .thenApply(
                n -> {
                  addGeneratedFsnAndPt(atomicCache, getSemanticTag(true, true, packageDetails), n);
                  productSummary.addNode(n);
                  return n;
                });

    CompletableFuture.allOf(mpp, tpp, ctpp).get();

    Node mppNode = mpp.get();
    Node tppNode = tpp.get();
    Node ctppNode = ctpp.get();

    addParent(tppNode, mppNode);
    addParent(ctppNode, tppNode);
    productSummary.addEdge(tppNode.getConceptId(), mppNode.getConceptId(), IS_A_LABEL);
    productSummary.addEdge(ctppNode.getConceptId(), tppNode.getConceptId(), IS_A_LABEL);
    productSummary.setSubject(ctppNode);

    productSummary.addNode(packageDetails.getProductName(), TP_LABEL);
    productSummary.addEdge(
        tppNode.getConceptId(),
        packageDetails.getProductName().getConceptId(),
        HAS_PRODUCT_NAME_LABEL);
    productSummary.addEdge(
        ctppNode.getConceptId(),
        packageDetails.getProductName().getConceptId(),
        HAS_PRODUCT_NAME_LABEL);

    for (ProductSummary summary : innerPackageSummaries.values()) {
      productSummary.addSummary(summary);
      productSummary.addEdge(
          ctppNode.getConceptId(), summary.getSubject().getConceptId(), CONTAINS_LABEL);
      productSummary.addEdge(
          tppNode.getConceptId(),
          summary.getSingleConceptWithLabel(TPP_LABEL).getConceptId(),
          CONTAINS_LABEL);
      productSummary.addEdge(
          mppNode.getConceptId(),
          summary.getSingleConceptWithLabel(MPP_LABEL).getConceptId(),
          CONTAINS_LABEL);
    }

    for (ProductSummary summary : innnerProductSummaries.values()) {
      productSummary.addSummary(summary);
      productSummary.addEdge(
          ctppNode.getConceptId(), summary.getSubject().getConceptId(), CONTAINS_LABEL);
      productSummary.addEdge(
          tppNode.getConceptId(), summary.getSubject().getConceptId(), CONTAINS_LABEL);
      productSummary.addEdge(
          mppNode.getConceptId(),
          summary.getSingleConceptWithLabel(MPUU_LABEL).getConceptId(),
          CONTAINS_LABEL);
    }

    Set<Edge> transitiveContainsEdges =
        ProductSummaryService.getTransitiveEdges(productSummary, new HashSet<>());
    productSummary.getEdges().addAll(transitiveContainsEdges);

    productSummary.getNodes().stream()
        .filter(Node::isNewConcept)
        .forEach(n -> n.getNewConceptDetails().getAxioms().forEach(a -> sortRelationships(a)));

    return productSummary;
  }

  private CompletableFuture<Node> getOrCreatePackagedClinicalDrug(
      String branch,
      PackageDetails<MedicationProductDetails> packageDetails,
      Map<PackageQuantity<MedicationProductDetails>, ProductSummary> innerPackageSummaries,
      Map<ProductQuantity<MedicationProductDetails>, ProductSummary> innnerProductSummaries,
      boolean branded,
      boolean container,
      AtomicCache atomicCache) {

    String semanticTag;
    String label;
    Set<String> refsets;
    final Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers =
        branded && container
            ? SnowstormDtoUtil.getExternalIdentifierReferenceSetEntries(packageDetails)
            : Set.of();
    if (branded) {
      if (container) {
        label = CTPP_LABEL;
        refsets = Set.of(CTPP_REFSET_ID.getValue());
      } else {
        label = TPP_LABEL;
        refsets = Set.of(TPP_REFSET_ID.getValue());
      }
    } else {
      label = MPP_LABEL;
      refsets = Set.of(MPP_REFSET_ID.getValue());
    }

    semanticTag = getSemanticTag(branded, container, packageDetails);

    Set<SnowstormRelationship> relationships =
        createPackagedClinicalDrugRelationships(
            packageDetails, innerPackageSummaries, innnerProductSummaries, branded, container);

    return nodeGeneratorService.generateNodeAsync(
        branch,
        atomicCache,
        relationships,
        refsets,
        label,
        referenceSetMembers,
        semanticTag,
        packageDetails.getSelectedConceptIdentifiers(),
        true,
        label.equals(MPP_LABEL));
  }

  private void addGeneratedFsnAndPt(AtomicCache atomicCache, String semanticTag, Node node) {
    if (node.isNewConcept()) {
      Instant start = Instant.now();
      SnowstormConceptView scon = SnowstormDtoUtil.toSnowstormConceptView(node);
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
      axiomN = atomicCache.substituteIdsInAxiom(axiomN, node.getNewConceptDetails().getConceptId());

      FsnAndPt fsnAndPt =
          nameGenerationService.createFsnAndPreferredTerm(
              new NameGeneratorSpec(semanticTag, axiomN));

      node.getNewConceptDetails().setFullySpecifiedName(fsnAndPt.getFSN());
      node.getNewConceptDetails().setPreferredTerm(fsnAndPt.getPT());
      atomicCache.addFsn(node.getConceptId(), fsnAndPt.getFSN());
      if (log.isLoggable(java.util.logging.Level.FINE)) {
        log.fine(
            "Generated FSN and PT for "
                + node.getConceptId()
                + " FSN: "
                + fsnAndPt.getFSN()
                + " PT: "
                + fsnAndPt.getPT()
                + " in "
                + (Duration.between(start, Instant.now()).toMillis())
                + " ms");
      }
    }
  }

  private Set<SnowstormRelationship> createPackagedClinicalDrugRelationships(
      PackageDetails<MedicationProductDetails> packageDetails,
      Map<PackageQuantity<MedicationProductDetails>, ProductSummary> innerPackageSummaries,
      Map<ProductQuantity<MedicationProductDetails>, ProductSummary> innnerProductSummaries,
      boolean branded,
      boolean container) {

    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(
        getSnowstormRelationship(IS_A, MEDICINAL_PRODUCT_PACKAGE, 0));

    if (branded && container) {
      addRelationshipIfNotNull(
          relationships, packageDetails.getContainerType(), HAS_CONTAINER_TYPE, 0);
    }

    if (branded) {
      addRelationshipIfNotNull(relationships, packageDetails.getProductName(), HAS_PRODUCT_NAME, 0);
    }

    int group = 1;
    for (Entry<ProductQuantity<MedicationProductDetails>, ProductSummary> entry :
        innnerProductSummaries.entrySet()) {
      Node contained;
      ProductSummary productSummary = entry.getValue();
      if (branded) {
        contained = productSummary.getSubject();
      } else {
        contained = productSummary.getSingleConceptWithLabel(MPUU_LABEL);
      }
      relationships.add(getSnowstormRelationship(CONTAINS_CD, contained, group));

      ProductQuantity<MedicationProductDetails> quantity = entry.getKey();
      relationships.add(getSnowstormRelationship(HAS_PACK_SIZE_UNIT, quantity.getUnit(), group));
      relationships.add(
          getSnowstormDatatypeComponent(
              HAS_PACK_SIZE_VALUE, quantity.getValue().toString(), DataTypeEnum.DECIMAL, group));

      relationships.add(
          getSnowstormDatatypeComponent(
              COUNT_OF_CONTAINED_COMPONENT_INGREDIENT,
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
      Node contained;
      ProductSummary productSummary = entry.getValue();
      if (branded && container) {
        contained = productSummary.getSubject();
      } else if (branded) {
        contained = productSummary.getSingleConceptWithLabel(TPP_LABEL);
      } else {
        contained = productSummary.getSingleConceptWithLabel(MPP_LABEL);
      }
      relationships.add(getSnowstormRelationship(CONTAINS_PACKAGED_CD, contained, group));

      PackageQuantity<MedicationProductDetails> quantity = entry.getKey();
      relationships.add(getSnowstormRelationship(HAS_PACK_SIZE_UNIT, quantity.getUnit(), group));
      relationships.add(
          getSnowstormDatatypeComponent(
              HAS_PACK_SIZE_VALUE, quantity.getValue().toString(), DataTypeEnum.DECIMAL, group));
      group++;
    }

    if (!innerPackageSummaries.isEmpty()) {
      relationships.add(
          getSnowstormDatatypeComponent(
              COUNT_OF_CONTAINED_PACKAGE_TYPE,
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
      List<String> selectedConceptIdentifiers)
      throws ExecutionException, InterruptedException {

    validateProductDetails(productDetails);

    ProductSummary productSummary = new ProductSummary();

    CompletableFuture<Node> mp =
        findOrCreateMp(branch, productDetails, atomicCache, selectedConceptIdentifiers)
            .thenApply(
                n -> {
                  addGeneratedFsnAndPt(atomicCache, MEDICINAL_PRODUCT_SEMANTIC_TAG.getValue(), n);
                  productSummary.addNode(n);
                  return n;
                });
    CompletableFuture<Node> mpuu =
        findOrCreateUnit(
                branch, productDetails, null, false, atomicCache, selectedConceptIdentifiers)
            .thenApply(
                n -> {
                  addGeneratedFsnAndPt(atomicCache, getSemanticTag(false, productDetails), n);
                  productSummary.addNode(n);
                  return n;
                });

    CompletableFuture.allOf(mp, mpuu).get();

    Node mpNode = mp.get();
    Node mpuuNode = mpuu.get();

    CompletableFuture<Node> tpuu =
        findOrCreateUnit(
                branch, productDetails, mpuuNode, true, atomicCache, selectedConceptIdentifiers)
            .thenApply(
                n -> {
                  addGeneratedFsnAndPt(atomicCache, getSemanticTag(true, productDetails), n);
                  productSummary.addNode(n);
                  return n;
                });
    Node tpuuNode = tpuu.get();

    addParent(mpuuNode, mpNode);

    productSummary.addEdge(mpuuNode.getConceptId(), mpNode.getConceptId(), IS_A_LABEL);
    productSummary.addEdge(tpuuNode.getConceptId(), mpuuNode.getConceptId(), IS_A_LABEL);

    productSummary.addNode(productDetails.getProductName(), TP_LABEL);
    productSummary.addEdge(
        tpuuNode.getConceptId(),
        productDetails.getProductName().getConceptId(),
        HAS_PRODUCT_NAME_LABEL);

    productSummary.setSubject(tpuuNode);

    return productSummary;
  }

  private CompletableFuture<Node> findOrCreateUnit(
      String branch,
      MedicationProductDetails productDetails,
      Node parent,
      boolean branded,
      AtomicCache atomicCache,
      List<String> selectedConceptIdentifiers) {
    String label = branded ? TPUU_LABEL : MPUU_LABEL;
    Set<String> referencedIds =
        Set.of(branded ? TPUU_REFSET_ID.getValue() : MPUU_REFSET_ID.getValue());
    String semanticTag = getSemanticTag(branded, productDetails);

    Set<SnowstormRelationship> relationships =
        createClinicalDrugRelationships(productDetails, parent, branded);

    return nodeGeneratorService.generateNodeAsync(
        branch,
        atomicCache,
        relationships,
        referencedIds,
        label,
        null,
        semanticTag,
        selectedConceptIdentifiers,
        !branded,
        false);
  }

  private CompletableFuture<Node> findOrCreateMp(
      String branch,
      MedicationProductDetails details,
      AtomicCache atomicCache,
      List<String> selectedConceptIdentifiers) {
    Set<SnowstormRelationship> relationships = createMpRelationships(details);
    String semanticTag = MEDICINAL_PRODUCT_SEMANTIC_TAG.getValue();

    return nodeGeneratorService.generateNodeAsync(
        branch,
        atomicCache,
        relationships,
        Set.of(MP_REFSET_ID.getValue()),
        MP_LABEL,
        null,
        semanticTag,
        selectedConceptIdentifiers,
        false,
        false);
  }

  private Set<SnowstormRelationship> createClinicalDrugRelationships(
      MedicationProductDetails productDetails, Node parent, boolean branded) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A, MEDICINAL_PRODUCT, 0));
    if (parent != null) {
      relationships.add(getSnowstormRelationship(IS_A, parent, 0));
    }

    if (branded) {
      relationships.add(
          getSnowstormRelationship(HAS_PRODUCT_NAME, productDetails.getProductName(), 0));

      relationships.add(
          getSnowstormDatatypeComponent(
              HAS_OTHER_IDENTIFYING_INFORMATION,
              !StringUtils.hasLength(productDetails.getOtherIdentifyingInformation())
                  ? "None"
                  : productDetails.getOtherIdentifyingInformation(),
              DataTypeEnum.STRING,
              0));
    }

    addRelationshipIfNotNull(
        relationships, productDetails.getContainerType(), HAS_CONTAINER_TYPE, 0);
    addRelationshipIfNotNull(relationships, productDetails.getDeviceType(), HAS_DEVICE_TYPE, 0);

    SnowstormConceptMini doseForm =
        productDetails.getGenericForm() == null ? null : productDetails.getGenericForm();

    if (branded) {
      doseForm =
          productDetails.getSpecificForm() == null ? doseForm : productDetails.getSpecificForm();
    }

    if (doseForm != null) {
      relationships.add(getSnowstormRelationship(HAS_MANUFACTURED_DOSE_FORM, doseForm, 0));
    }

    addQuantityIfNotNull(
        productDetails.getQuantity(),
        relationships,
        HAS_PACK_SIZE_VALUE,
        HAS_PACK_SIZE_UNIT,
        DataTypeEnum.DECIMAL,
        0);

    int group = 1;
    for (Ingredient ingredient : productDetails.getActiveIngredients()) {
      addRelationshipIfNotNull(
          relationships, ingredient.getActiveIngredient(), HAS_ACTIVE_INGREDIENT, group);
      addRelationshipIfNotNull(
          relationships, ingredient.getPreciseIngredient(), HAS_PRECISE_ACTIVE_INGREDIENT, group);
      addRelationshipIfNotNull(
          relationships, ingredient.getBasisOfStrengthSubstance(), HAS_BOSS, group);
      addQuantityIfNotNull(
          ingredient.getTotalQuantity(),
          relationships,
          HAS_TOTAL_QUANTITY_VALUE,
          HAS_TOTAL_QUANTITY_UNIT,
          DataTypeEnum.DECIMAL,
          group);
      addQuantityIfNotNull(
          ingredient.getConcentrationStrength(),
          relationships,
          CONCENTRATION_STRENGTH_VALUE,
          CONCENTRATION_STRENGTH_UNIT,
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
              COUNT_OF_ACTIVE_INGREDIENT,
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
    relationships.add(getSnowstormRelationship(IS_A, MEDICINAL_PRODUCT, 0));
    int group = 1;
    for (Ingredient ingredient : productDetails.getActiveIngredients()) {
      relationships.add(
          getSnowstormRelationship(HAS_ACTIVE_INGREDIENT, ingredient.getActiveIngredient(), group));
      group++;
    }
    return relationships;
  }

  private Pair<SnowstormConceptMini, SnowstormConceptMini> getNumeratorAndDenominatorUnit(
      String branch, String unit) {
    List<SnowstormRelationship> relationships =
        snowstormClient.getRelationships(branch, unit).block().getItems();

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

  private void validateProductQuantity(
      String branch, ProductQuantity<MedicationProductDetails> productQuantity) {
    // Leave the MRCM validation to the MRCM - the UI should already enforce this and the validation
    // in the MS will catch it. Validating here will just slow things down.
    ValidationUtil.validateQuantityValueIsOneIfUnitIsEach(productQuantity);

    // if the contained product has a container/device type or a quantity then the unit must be
    // each and the quantity must be an integer
    MedicationProductDetails productDetails = productQuantity.getProductDetails();
    Quantity productDetailsQuantity = productDetails.getQuantity();
    if ((productDetails.getContainerType() != null
            || productDetails.getDeviceType() != null
            || productDetailsQuantity != null)
        && (!productQuantity.getUnit().getConceptId().equals(UNIT_OF_PRESENTATION.getValue())
            || !ValidationUtil.isIntegerValue(productQuantity.getValue()))) {
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
        // there are a small number of products that match this pattern, so we'll log a warning
        log.warning(
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
      }

      // if pack size and concentration strength are populated
      if (productDetailsQuantity != null
          && productDetailsQuantity.getUnit() != null
          && ingredient.getConcentrationStrength() != null) {
        // validate that the units line up
        Pair<SnowstormConceptMini, SnowstormConceptMini> numeratorAndDenominator =
            getNumeratorAndDenominatorUnit(
                branch, ingredient.getConcentrationStrength().getUnit().getConceptId());

        // validate the product quantity unit matches the denominator of the concentration strength
        if (!productDetailsQuantity
            .getUnit()
            .getConceptId()
            .equals(numeratorAndDenominator.getSecond().getConceptId())) {
          log.warning(
              "Product quantity unit "
                  + getIdAndFsnTerm(productDetailsQuantity.getUnit())
                  + " does not match ingredient "
                  + getIdAndFsnTerm(ingredient.getActiveIngredient())
                  + " concetration strength denominator "
                  + getIdAndFsnTerm(numeratorAndDenominator.getSecond())
                  + " as expected");
        }

        // if the total quantity is also populated
        if (ingredient.getTotalQuantity() != null) {
          // validate that the total quantity unit matches the numerator of the concentration
          // strength
          if (!ingredient
              .getTotalQuantity()
              .getUnit()
              .getConceptId()
              .equals(numeratorAndDenominator.getFirst().getConceptId())) {
            log.warning(
                "Ingredient "
                    + getIdAndFsnTerm(ingredient.getActiveIngredient())
                    + " total quantity unit "
                    + getIdAndFsnTerm(ingredient.getTotalQuantity().getUnit())
                    + " does not match the concetration strength numerator "
                    + getIdAndFsnTerm(numeratorAndDenominator.getFirst())
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
  }

  private void validatePackageQuantity(PackageQuantity<MedicationProductDetails> packageQuantity) {
    // Leave the MRCM validation to the MRCM - the UI should already enforce this and the validation
    // in the MS will catch it. Validating here will just slow things down.

    // -- package quantity unit must be each and the quantitiy must be an integer
    ValidationUtil.validateQuantityValueIsOneIfUnitIsEach(packageQuantity);

    // validate that the package is only nested one deep
    if (packageQuantity.getPackageDetails().getContainedPackages() != null
        && !packageQuantity.getPackageDetails().getContainedPackages().isEmpty()) {
      throw new ProductAtomicDataValidationProblem(
          "A contained package must not contain further packages - nesting is only one level deep");
    }
  }

  private void validateProductDetails(MedicationProductDetails productDetails) {
    // one of form, container or device must be populated
    if (productDetails.getGenericForm() == null
        && productDetails.getContainerType() == null
        && productDetails.getDeviceType() == null) {
      throw new ProductAtomicDataValidationProblem(
          "One of form, container type or device type must be populated");
    }

    // specific dose form can only be populated if generic dose form is populated
    if (productDetails.getSpecificForm() != null && productDetails.getGenericForm() == null) {
      throw new ProductAtomicDataValidationProblem(
          "Specific form can only be populated if generic form is populated");
    }

    // If Container is populated, Form must be populated
    if (productDetails.getContainerType() != null && productDetails.getGenericForm() == null) {
      throw new ProductAtomicDataValidationProblem(
          "If container type is populated, form must be populated");
    }

    // If Form is populated, Device must not be populated
    if (productDetails.getGenericForm() != null && productDetails.getDeviceType() != null) {
      throw new ProductAtomicDataValidationProblem(
          "If form is populated, device type must not be populated");
    }

    // If Device is populated, Form and Container must not be populated
    if (productDetails.getDeviceType() != null
        && (productDetails.getGenericForm() != null || productDetails.getContainerType() != null)) {
      throw new ProductAtomicDataValidationProblem(
          "If device type is populated, form and container type must not be populated");
    }

    // product name must be populated
    if (productDetails.getProductName() == null) {
      throw new ProductAtomicDataValidationProblem("Product name must be populated");
    }

    productDetails.getActiveIngredients().forEach(this::validateIngredient);
  }

  private void validateIngredient(Ingredient ingredient) {
    // BoSS is only populated if the active ingredient is populated
    if (ingredient.getActiveIngredient() == null
        && ingredient.getBasisOfStrengthSubstance() != null) {
      throw new ProductAtomicDataValidationProblem(
          "Basis of strength substance can only be populated if active ingredient is populated");
    }

    // precise ingredient is only populated if active ingredient is populated
    if (ingredient.getActiveIngredient() == null && ingredient.getPreciseIngredient() != null) {
      throw new ProductAtomicDataValidationProblem(
          "Precise ingredient can only be populated if active ingredient is populated");
    }

    // if BoSS is populated then total quantity or concentration strength must be populated
    if (ingredient.getBasisOfStrengthSubstance() != null
        && ingredient.getTotalQuantity() == null
        && ingredient.getConcentrationStrength() == null) {
      throw new ProductAtomicDataValidationProblem(
          "Basis of strength substance is populated but neither total quantity or concentration strength are populated");
    }

    // active ingredient is mandatory
    if (ingredient.getActiveIngredient() == null) {
      throw new ProductAtomicDataValidationProblem("Active ingredient must be populated");
    }
  }

  private void validatePackageDetails(PackageDetails<MedicationProductDetails> packageDetails) {
    // Leave the MRCM validation to the MRCM - the UI should already enforce this and the validation
    // in the MS will catch it. Validating here will just slow things down.

    // validate the package details
    // - product name is a product name - MRCM?
    // - container type is a container type - MRCM?

    // product name must be populated
    if (packageDetails.getProductName() == null) {
      throw new ProductAtomicDataValidationProblem("Product name must be populated");
    }

    // container type is mandatory
    if (packageDetails.getContainerType() == null) {
      throw new ProductAtomicDataValidationProblem("Container type must be populated");
    }

    // if the package contains other packages it must use a unit of each for the contained packages
    if (packageDetails.getContainedPackages() != null
        && !packageDetails.getContainedPackages().isEmpty()
        && !packageDetails.getContainedPackages().stream()
            .allMatch(p -> p.getUnit().getConceptId().equals(UNIT_OF_PRESENTATION.getValue()))) {
      throw new ProductAtomicDataValidationProblem(
          "If the package contains other packages it must use a unit of 'each' for the contained packages");
    }

    // if the package contains other packages it must have a container type of "Pack"
    if (packageDetails.getContainedPackages() != null
        && !packageDetails.getContainedPackages().isEmpty()
        && !packageDetails
            .getContainerType()
            .getConceptId()
            .equals(SnomedConstants.PACK.getValue())) {
      throw new ProductAtomicDataValidationProblem(
          "If the package contains other packages it must have a container type of 'Pack'");
    }
  }
}
