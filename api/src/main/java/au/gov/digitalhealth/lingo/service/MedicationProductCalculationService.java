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

import static au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType.CONTAINED_PACKAGE;
import static au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType.PACKAGE;
import static au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType.PRODUCT;
import static au.gov.digitalhealth.lingo.util.AmtConstants.CONCENTRATION_STRENGTH_UNIT;
import static au.gov.digitalhealth.lingo.util.AmtConstants.CONCENTRATION_STRENGTH_VALUE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.CONTAINS_PACKAGED_CD;
import static au.gov.digitalhealth.lingo.util.AmtConstants.COUNT_OF_CONTAINED_COMPONENT_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.AmtConstants.COUNT_OF_CONTAINED_PACKAGE_TYPE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.CTPP_REFSET_ID;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_CONTAINER_TYPE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_DEVICE_TYPE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_OTHER_IDENTIFYING_INFORMATION;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_TOTAL_QUANTITY_UNIT;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_TOTAL_QUANTITY_VALUE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.MPP_REFSET_ID;
import static au.gov.digitalhealth.lingo.util.AmtConstants.MPUU_REFSET_ID;
import static au.gov.digitalhealth.lingo.util.AmtConstants.MP_REFSET_ID;
import static au.gov.digitalhealth.lingo.util.AmtConstants.NO_OII_VALUE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.TPP_REFSET_ID;
import static au.gov.digitalhealth.lingo.util.AmtConstants.TPUU_REFSET_ID;
import static au.gov.digitalhealth.lingo.util.NonDefiningPropertiesConverter.calculateNonDefiningRelationships;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.BRANDED_CLINICAL_DRUG_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.BRANDED_PRODUCT_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CLINICAL_DRUG_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CONTAINERIZED_BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CONTAINERIZED_BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CONTAINS_CD;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.COUNT_OF_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_BOSS;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_MANUFACTURED_DOSE_FORM;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRECISE_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRODUCT_NAME;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.IS_A;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MEDICINAL_PRODUCT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MEDICINAL_PRODUCT_PACKAGE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MEDICINAL_PRODUCT_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.PRODUCT_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.PRODUCT_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.STATED_RELATIONSHIP;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.UNIT_MG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.UNIT_ML;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.UNIT_OF_PRESENTATION;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.addQuantityIfNotNull;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.addRelationshipIfNotNull;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getIdAndFsnTerm;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSnowstormDatatypeComponent;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSnowstormRelationship;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormConcreteValue.DataTypeEnum;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.configuration.FieldBindingConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.MappingRefset;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.Edge;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.*;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import au.gov.digitalhealth.lingo.product.details.properties.ReferenceSet;
import au.gov.digitalhealth.lingo.util.AmtConstants;
import au.gov.digitalhealth.lingo.util.BigDecimalFormatter;
import au.gov.digitalhealth.lingo.util.OwlAxiomService;
import au.gov.digitalhealth.lingo.util.RelationshipSorter;
import au.gov.digitalhealth.lingo.util.SnomedConstants;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import au.gov.digitalhealth.lingo.util.ValidationUtil;
import au.gov.digitalhealth.tickets.service.TicketServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

@Service
@Log
public class MedicationProductCalculationService {

  SnowstormClient snowstormClient;
  NameGenerationService nameGenerationService;
  TicketServiceImpl ticketService;

  OwlAxiomService owlAxiomService;
  ObjectMapper objectMapper;

  NodeGeneratorService nodeGeneratorService;
  FieldBindingConfiguration fieldBindingConfiguration;
  Models models;

  @Value("${snomio.decimal-scale}")
  int decimalScale;

  @Autowired
  public MedicationProductCalculationService(
      SnowstormClient snowstormClient,
      NameGenerationService nameGenerationService,
      TicketServiceImpl ticketService,
      OwlAxiomService owlAxiomService,
      ObjectMapper objectMapper,
      NodeGeneratorService nodeGeneratorService,
      FieldBindingConfiguration fieldBindingConfiguration,
      Models models) {
    this.snowstormClient = snowstormClient;
    this.nameGenerationService = nameGenerationService;
    this.ticketService = ticketService;
    this.owlAxiomService = owlAxiomService;
    this.objectMapper = objectMapper;
    this.nodeGeneratorService = nodeGeneratorService;
    this.fieldBindingConfiguration = fieldBindingConfiguration;
    this.models = models;
  }

  public static BigDecimal calculateConcentrationStrength(
      BigDecimal totalQty, BigDecimal productSize) {
    BigDecimal result =
        totalQty
            .divide(productSize, new MathContext(10, RoundingMode.HALF_UP))
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
                + totalQty
                + "/"
                + productSize
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
          .forEach(a -> a.getRelationships().add(getSnowstormRelationship(IS_A, mpNode, 0)));
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
    boolean device = productDetails.hasDeviceType();
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

  private static void validateExternalIdentifier(
      ExternalIdentifier externalIdentifier, Map<String, MappingRefset> mappingRefsets) {
    if (!mappingRefsets.containsKey(externalIdentifier.getIdentifierScheme())) {
      throw new ProductAtomicDataValidationProblem(
          "External identifier scheme "
              + externalIdentifier.getIdentifierScheme()
              + " is not valid for this product");
    }
    MappingRefset mappingRefset = mappingRefsets.get(externalIdentifier.getIdentifierScheme());
    if (!mappingRefset.getMappingTypes().contains(externalIdentifier.getRelationshipType())) {
      throw new ProductAtomicDataValidationProblem(
          "External identifier relationship type "
              + externalIdentifier.getRelationshipType()
              + " is not valid for scheme "
              + externalIdentifier.getIdentifierScheme());
    }
    if (!mappingRefset.getDataType().isValidValue(externalIdentifier.getIdentifierValue())) {
      throw new ProductAtomicDataValidationProblem(
          "External identifier value "
              + externalIdentifier.getIdentifierValue()
              + " is not valid for scheme "
              + externalIdentifier.getIdentifierScheme());
    }
    if (mappingRefset.getValueRegexValidation() != null
        && !externalIdentifier
            .getIdentifierValue()
            .matches(mappingRefset.getValueRegexValidation())) {
      throw new ProductAtomicDataValidationProblem(
          "External identifier value "
              + externalIdentifier.getIdentifierValue()
              + " does not match the regex validation for scheme "
              + externalIdentifier.getIdentifierScheme());
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

    Mono<List<String>> taskChangedConceptIds = snowstormClient.getConceptIdsChangedOnTask(branch);

    Mono<List<String>> projectChangedConceptIds =
        snowstormClient.getConceptIdsChangedOnProject(branch);

    validatePackageDetails(packageDetails, branch);

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
                  nameGenerationService.addGeneratedFsnAndPt(
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
                  nameGenerationService.addGeneratedFsnAndPt(
                      atomicCache, getSemanticTag(true, false, packageDetails), n);
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
                  nameGenerationService.addGeneratedFsnAndPt(
                      atomicCache, getSemanticTag(true, true, packageDetails), n);
                  productSummary.addNode(n);
                  return n;
                });

    CompletableFuture.allOf(mpp, tpp, ctpp).get();

    Node mppNode = mpp.get();
    Node tppNode = tpp.get();
    Node ctppNode = ctpp.get();

    addParent(tppNode, mppNode);
    addParent(ctppNode, tppNode);
    productSummary.addEdge(
        tppNode.getConceptId(), mppNode.getConceptId(), ProductSummaryService.IS_A_LABEL);
    productSummary.addEdge(
        ctppNode.getConceptId(), tppNode.getConceptId(), ProductSummaryService.IS_A_LABEL);
    productSummary.setSingleSubject(ctppNode);

    productSummary.addNode(packageDetails.getProductName(), ProductSummaryService.TP_LABEL);
    productSummary.addEdge(
        tppNode.getConceptId(),
        packageDetails.getProductName().getConceptId(),
        ProductSummaryService.HAS_PRODUCT_NAME_LABEL);
    productSummary.addEdge(
        ctppNode.getConceptId(),
        packageDetails.getProductName().getConceptId(),
        ProductSummaryService.HAS_PRODUCT_NAME_LABEL);

    for (ProductSummary summary : innerPackageSummaries.values()) {
      productSummary.addSummary(summary);
      productSummary.addEdge(
          ctppNode.getConceptId(),
          summary.getSingleSubject().getConceptId(),
          ProductSummaryService.CONTAINS_LABEL);
      productSummary.addEdge(
          tppNode.getConceptId(),
          summary.getSingleConceptWithLabel(ProductSummaryService.TPP_LABEL).getConceptId(),
          ProductSummaryService.CONTAINS_LABEL);
      productSummary.addEdge(
          mppNode.getConceptId(),
          summary.getSingleConceptWithLabel(ProductSummaryService.MPP_LABEL).getConceptId(),
          ProductSummaryService.CONTAINS_LABEL);
    }

    for (ProductSummary summary : innnerProductSummaries.values()) {
      productSummary.addSummary(summary);
      productSummary.addEdge(
          ctppNode.getConceptId(),
          summary.getSingleSubject().getConceptId(),
          ProductSummaryService.CONTAINS_LABEL);
      productSummary.addEdge(
          tppNode.getConceptId(),
          summary.getSingleSubject().getConceptId(),
          ProductSummaryService.CONTAINS_LABEL);
      productSummary.addEdge(
          mppNode.getConceptId(),
          summary.getSingleConceptWithLabel(ProductSummaryService.MPUU_LABEL).getConceptId(),
          ProductSummaryService.CONTAINS_LABEL);
    }

    Set<Edge> transitiveContainsEdges =
        ProductSummaryService.getTransitiveEdges(productSummary, new HashSet<>());
    productSummary.getEdges().addAll(transitiveContainsEdges);

    productSummary.getNodes().stream()
        .filter(Node::isNewConcept)
        .forEach(
            n ->
                n.getNewConceptDetails()
                    .getAxioms()
                    .forEach(RelationshipSorter::sortRelationships));

    productSummary.updateNodeChangeStatus(
        taskChangedConceptIds.block(), projectChangedConceptIds.block());

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
    ModelLevelType modelLevelType;

    if (branded) {
      if (container) {
        label = ProductSummaryService.CTPP_LABEL;
        modelLevelType = ModelLevelType.REAL_CONTAINERIZED_PACKAGED_CLINICAL_DRUG;
        refsets = Set.of(CTPP_REFSET_ID.getValue());
      } else {
        label = ProductSummaryService.TPP_LABEL;
        modelLevelType = ModelLevelType.REAL_PACKAGED_CLINICAL_DRUG;
        refsets = Set.of(TPP_REFSET_ID.getValue());
      }
    } else {
      label = ProductSummaryService.MPP_LABEL;
      modelLevelType = ModelLevelType.PACKAGED_CLINICAL_DRUG;
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
        getReferenceSetMembers(
            packageDetails, models.getModelConfiguration(branch), PACKAGE, modelLevelType),
        calculateNonDefiningRelationships(
            models.getModelConfiguration(branch), packageDetails, modelLevelType),
        semanticTag,
        packageDetails.getSelectedConceptIdentifiers(),
        true,
        label.equals(ProductSummaryService.MPP_LABEL),
        true);
  }

  private Set<SnowstormRelationship> createPackagedClinicalDrugRelationships(
      PackageDetails<MedicationProductDetails> packageDetails,
      Map<PackageQuantity<MedicationProductDetails>, ProductSummary> innerPackageSummaries,
      Map<ProductQuantity<MedicationProductDetails>, ProductSummary> innnerProductSummaries,
      boolean branded,
      boolean container) {

    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A, MEDICINAL_PRODUCT_PACKAGE, 0));

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
        contained = productSummary.getSingleSubject();
      } else {
        contained = productSummary.getSingleConceptWithLabel(ProductSummaryService.MPUU_LABEL);
      }
      relationships.add(getSnowstormRelationship(CONTAINS_CD, contained, group));

      ProductQuantity<MedicationProductDetails> quantity = entry.getKey();
      relationships.add(
          getSnowstormRelationship(
              HAS_PACK_SIZE_UNIT, quantity.getUnit(), group, STATED_RELATIONSHIP));
      relationships.add(
          getSnowstormDatatypeComponent(
              HAS_PACK_SIZE_VALUE,
              BigDecimalFormatter.formatBigDecimal(quantity.getValue(), decimalScale),
              DataTypeEnum.DECIMAL,
              group,
              STATED_RELATIONSHIP));

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
              group,
              STATED_RELATIONSHIP));

      group++;
    }

    for (Entry<PackageQuantity<MedicationProductDetails>, ProductSummary> entry :
        innerPackageSummaries.entrySet()) {
      Node contained;
      ProductSummary productSummary = entry.getValue();
      if (branded && container) {
        contained = productSummary.getSingleSubject();
      } else if (branded) {
        contained = productSummary.getSingleConceptWithLabel(ProductSummaryService.TPP_LABEL);
      } else {
        contained = productSummary.getSingleConceptWithLabel(ProductSummaryService.MPP_LABEL);
      }
      relationships.add(getSnowstormRelationship(CONTAINS_PACKAGED_CD, contained, group));

      PackageQuantity<MedicationProductDetails> quantity = entry.getKey();
      relationships.add(
          getSnowstormRelationship(
              HAS_PACK_SIZE_UNIT, quantity.getUnit(), group, STATED_RELATIONSHIP));
      relationships.add(
          getSnowstormDatatypeComponent(
              HAS_PACK_SIZE_VALUE,
              BigDecimalFormatter.formatBigDecimal(quantity.getValue(), decimalScale),
              DataTypeEnum.DECIMAL,
              group,
              STATED_RELATIONSHIP));
      group++;
    }

    if (!innerPackageSummaries.isEmpty()) {
      relationships.add(
          getSnowstormDatatypeComponent(
              COUNT_OF_CONTAINED_PACKAGE_TYPE,
              // get the unique set of active ingredients
              Integer.toString(
                  innerPackageSummaries.values().stream()
                      .map(v -> v.getSingleSubject().getConceptId())
                      .collect(Collectors.toSet())
                      .size()),
              DataTypeEnum.INTEGER,
              0,
              STATED_RELATIONSHIP));
    }

    return relationships;
  }

  private ProductSummary createProduct(
      String branch,
      MedicationProductDetails productDetails,
      AtomicCache atomicCache,
      List<String> selectedConceptIdentifiers)
      throws ExecutionException, InterruptedException {

    validateProductDetails(productDetails, branch);

    ProductSummary productSummary = new ProductSummary();

    CompletableFuture<Node> mp =
        findOrCreateMp(branch, productDetails, atomicCache, selectedConceptIdentifiers)
            .thenApply(
                n -> {
                  nameGenerationService.addGeneratedFsnAndPt(
                      atomicCache, MEDICINAL_PRODUCT_SEMANTIC_TAG.getValue(), n);
                  productSummary.addNode(n);
                  return n;
                });
    CompletableFuture<Node> mpuu =
        findOrCreateUnit(
                branch, productDetails, null, false, atomicCache, selectedConceptIdentifiers)
            .thenApply(
                n -> {
                  nameGenerationService.addGeneratedFsnAndPt(
                      atomicCache, getSemanticTag(false, productDetails), n);
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
                  nameGenerationService.addGeneratedFsnAndPt(
                      atomicCache, getSemanticTag(true, productDetails), n);
                  productSummary.addNode(n);
                  return n;
                });
    Node tpuuNode = tpuu.get();

    addParent(mpuuNode, mpNode);

    productSummary.addEdge(
        mpuuNode.getConceptId(), mpNode.getConceptId(), ProductSummaryService.IS_A_LABEL);
    productSummary.addEdge(
        tpuuNode.getConceptId(), mpuuNode.getConceptId(), ProductSummaryService.IS_A_LABEL);

    productSummary.addNode(productDetails.getProductName(), ProductSummaryService.TP_LABEL);
    productSummary.addEdge(
        tpuuNode.getConceptId(),
        productDetails.getProductName().getConceptId(),
        ProductSummaryService.HAS_PRODUCT_NAME_LABEL);

    productSummary.setSingleSubject(tpuuNode);

    return productSummary;
  }

  private CompletableFuture<Node> findOrCreateUnit(
      String branch,
      MedicationProductDetails productDetails,
      Node parent,
      boolean branded,
      AtomicCache atomicCache,
      List<String> selectedConceptIdentifiers) {
    String label = branded ? ProductSummaryService.TPUU_LABEL : ProductSummaryService.MPUU_LABEL;
    ModelLevelType modelLevelType =
        branded ? ModelLevelType.CLINICAL_DRUG : ModelLevelType.REAL_CLINICAL_DRUG;
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
        getReferenceSetMembers(
            productDetails, models.getModelConfiguration(branch), PRODUCT, modelLevelType),
        calculateNonDefiningRelationships(
            models.getModelConfiguration(branch), productDetails, modelLevelType),
        semanticTag,
        selectedConceptIdentifiers,
        !branded,
        false,
        true);
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
        ProductSummaryService.MP_LABEL,
        getReferenceSetMembers(
            details,
            models.getModelConfiguration(branch),
            PRODUCT,
            ModelLevelType.MEDICINAL_PRODUCT),
        calculateNonDefiningRelationships(
            models.getModelConfiguration(branch), details, ModelLevelType.MEDICINAL_PRODUCT),
        semanticTag,
        selectedConceptIdentifiers,
        false,
        false,
        false);
  }

  private Set<SnowstormReferenceSetMemberViewComponent> getReferenceSetMembers(
      PackageProductDetailsBase details,
      ModelConfiguration modelConfiguration,
      ProductPackageType type,
      ModelLevelType modelLevelType) {

    Map<String, au.gov.digitalhealth.lingo.configuration.model.ReferenceSet> referenceSetMap =
        modelConfiguration.getReferenceSetForType(type);

    Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers = new HashSet<>();

    for (ReferenceSet referenceSet : details.getReferenceSets()) {
      au.gov.digitalhealth.lingo.configuration.model.ReferenceSet configReferenceSet =
          referenceSetMap.get(referenceSet.getIdentifierScheme());
      if (configReferenceSet == null) {
        throw new ProductAtomicDataValidationProblem(
            "Reference set "
                + referenceSet.getIdentifierScheme()
                + " is not valid for this product");
      }
      if (configReferenceSet.getModelLevels().contains(modelLevelType)) {
        referenceSetMembers.add(
            new SnowstormReferenceSetMemberViewComponent()
                .refsetId(configReferenceSet.getIdentifier())
                .active(true));
      }
    }

    final Set<SnowstormReferenceSetMemberViewComponent> externalIdentifierReferenceSetEntries =
        SnowstormDtoUtil.getExternalIdentifierReferenceSetEntries(
            details.getExternalIdentifiers(),
            modelLevelType,
            modelConfiguration.getMappingRefsetMapForType(PACKAGE, CONTAINED_PACKAGE));

    referenceSetMembers.addAll(externalIdentifierReferenceSetEntries);

    return referenceSetMembers;
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
          getSnowstormRelationship(
              HAS_PRODUCT_NAME, productDetails.getProductName(), 0, STATED_RELATIONSHIP));

      relationships.add(
          getSnowstormDatatypeComponent(
              HAS_OTHER_IDENTIFYING_INFORMATION,
              !StringUtils.hasLength(productDetails.getOtherIdentifyingInformation())
                  ? NO_OII_VALUE.getValue()
                  : productDetails.getOtherIdentifyingInformation(),
              DataTypeEnum.STRING,
              0,
              STATED_RELATIONSHIP));
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
      relationships.add(
          getSnowstormRelationship(HAS_MANUFACTURED_DOSE_FORM, doseForm, 0, STATED_RELATIONSHIP));
    }

    addQuantityIfNotNull(
        productDetails.getQuantity(),
        decimalScale,
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
          decimalScale,
          relationships,
          HAS_TOTAL_QUANTITY_VALUE,
          HAS_TOTAL_QUANTITY_UNIT,
          DataTypeEnum.DECIMAL,
          group);
      addQuantityIfNotNull(
          ingredient.getConcentrationStrength(),
          decimalScale,
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
              0,
              STATED_RELATIONSHIP));
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
          getSnowstormRelationship(
              HAS_ACTIVE_INGREDIENT, ingredient.getActiveIngredient(), group, STATED_RELATIONSHIP));
      group++;
    }
    return relationships;
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
      boolean hasProductQuantity = productDetailsQuantity != null;
      boolean hasProductQuantityWithUnit =
          hasProductQuantity && productDetailsQuantity.getUnit() != null;
      boolean hasTotalQuantity = ingredient.getTotalQuantity() != null;
      boolean hasConcentrationStrength = ingredient.getConcentrationStrength() != null;
      if (hasTotalQuantity
          && snowstormClient.isCompositeUnit(branch, ingredient.getTotalQuantity().getUnit())) {
        throw new ProductAtomicDataValidationProblem(
            "Total quantity unit must not be composite. Ingredient was "
                + getIdAndFsnTerm(ingredient.getActiveIngredient())
                + " with unit "
                + getIdAndFsnTerm(ingredient.getTotalQuantity().getUnit()));
      }

      if (hasConcentrationStrength
          && !snowstormClient.isCompositeUnit(
              branch, ingredient.getConcentrationStrength().getUnit())) {
        throw new ProductAtomicDataValidationProblem(
            "Concentration strength unit must be composite. Ingredient was "
                + getIdAndFsnTerm(ingredient.getActiveIngredient())
                + " with unit "
                + getIdAndFsnTerm(ingredient.getConcentrationStrength().getUnit()));
      }

      // Total quantity and concentration strength must be present if the product quantity exists,
      // except under the following special conditions for legacy products:
      //  - either the product size unit is not in mg or ml,
      //  - or the concentration unit denominator does not match the product size unit,
      //  - or the ingredient is inert/excluded and therefore doesn't have a strength
      if (hasProductQuantityWithUnit && !(hasTotalQuantity && hasConcentrationStrength)) {
        boolean isUnitML =
            UNIT_ML.getValue().equals(productDetailsQuantity.getUnit().getConceptId());
        boolean isUnitMG =
            UNIT_MG.getValue().equals(productDetailsQuantity.getUnit().getConceptId());
        boolean isStrengthUnitMismatch =
            hasConcentrationStrength
                && ingredient.getConcentrationStrength().getUnit() != null
                && !isStrengthDenominatorMatchesQuantityUnit(
                    ingredient, productDetailsQuantity, branch);

        if (!isUnitML && !isUnitMG) {
          // Log a warning if the product quantity unit is not mg or mL
          log.warning(
              "Handling anomalous products, Product quantity unit is not mg or mL: "
                  + getIdAndFsnTerm(productDetailsQuantity.getUnit()));
        } else if (isStrengthUnitMismatch) {
          // Log a warning if the product quantity unit does not match the strength unit denominator
          log.warning(
              "Handling anomalous products, Product quantity unit does not match the strength unit denominator for ingredient: "
                  + getIdAndFsnTerm(ingredient.getActiveIngredient()));
        } else if (!fieldBindingConfiguration
            .getExcludedSubstances()
            .contains(ingredient.getActiveIngredient().getConceptId())) {
          // Invalid scenario user needs to provide the missing fields
          String missingFieldsMessage;
          if (!hasTotalQuantity && !hasConcentrationStrength) {
            missingFieldsMessage = "total quantity and concentration strength are not specified";
          } else if (!hasTotalQuantity) {
            missingFieldsMessage = "total quantity is not specified";
          } else {
            missingFieldsMessage = "concentration strength is not specified";
          }

          throw new ProductAtomicDataValidationProblem(
              String.format(
                  "Total quantity and concentration strength must be present if the product quantity exists for ingredient %s but %s",
                  getIdAndFsnTerm(ingredient.getActiveIngredient()), missingFieldsMessage));
        }

      } else if ((!hasProductQuantity || !hasProductQuantityWithUnit)
          && hasTotalQuantity
          && hasConcentrationStrength) {
        throw new ProductAtomicDataValidationProblem(
            "Total ingredient quantity and concentration strength specified for ingredient "
                + getIdAndFsnTerm(ingredient.getActiveIngredient())
                + " but product quantity not specified. "
                + "0, 1, or all 3 of these properties must be populated, populating 2 is not valid.");
      }

      // if pack size and concentration strength are populated
      if (hasProductQuantityWithUnit && hasConcentrationStrength) {
        // validate that the units line up
        Pair<SnowstormConceptMini, SnowstormConceptMini> numeratorAndDenominator =
            snowstormClient.getNumeratorAndDenominatorUnit(
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
        if (hasTotalQuantity) {
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

          BigDecimal calculatedConcentrationStrength =
              calculateConcentrationStrength(totalQuantity, quantity);

          if (!concentration.stripTrailingZeros().equals(calculatedConcentrationStrength)) {
            throw new ProductAtomicDataValidationProblem(
                "Concentration strength "
                    + concentration
                    + " for ingredient "
                    + getIdAndFsnTerm(ingredient.getActiveIngredient())
                    + " does not match calculated value "
                    + calculatedConcentrationStrength
                    + " from the provided total quantity and product quantity");
          }
        }
      }
    }
  }

  private boolean isStrengthDenominatorMatchesQuantityUnit(
      Ingredient ingredient, Quantity productDetailsQuantity, String branch) {
    Pair<SnowstormConceptMini, SnowstormConceptMini> numeratorAndDenominator =
        snowstormClient.getNumeratorAndDenominatorUnit(
            branch, ingredient.getConcentrationStrength().getUnit().getConceptId());

    // validate the product quantity unit matches the denominator of the concentration strength
    return productDetailsQuantity
        .getUnit()
        .getConceptId()
        .equals(numeratorAndDenominator.getSecond().getConceptId());
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

  private void validateProductDetails(MedicationProductDetails productDetails, String branch) {
    boolean genericFormPopulated = productDetails.getGenericForm() != null;
    boolean specificFormPopulated = productDetails.getSpecificForm() != null;
    boolean containerTypePopulated = productDetails.getContainerType() != null;
    boolean deviceTypePopulated = productDetails.getDeviceType() != null;

    // one of form, container or device must be populated
    if (!genericFormPopulated && !containerTypePopulated && !deviceTypePopulated) {
      throw new ProductAtomicDataValidationProblem(
          "One of form, container type or device type must be populated");
    }

    // specific dose form can only be populated if generic dose form is populated
    if (specificFormPopulated && !genericFormPopulated) {
      throw new ProductAtomicDataValidationProblem(
          "Specific form can only be populated if generic form is populated");
    }

    // If Container is populated, Form must be populated
    if (containerTypePopulated && !genericFormPopulated) {
      throw new ProductAtomicDataValidationProblem(
          "If container type is populated, form must be populated");
    }

    // If Form is populated, Device must not be populated
    if (genericFormPopulated && deviceTypePopulated) {
      throw new ProductAtomicDataValidationProblem(
          "If form is populated, device type must not be populated");
    }

    // If Device is populated, Form and Container must not be populated - already tested above

    // product name must be populated
    if (productDetails.getProductName() == null) {
      throw new ProductAtomicDataValidationProblem("Product name must be populated");
    }

    validateExternalIdentifiers(branch, PRODUCT, productDetails.getExternalIdentifiers());

    productDetails.getActiveIngredients().forEach(this::validateIngredient);
  }

  private void validateExternalIdentifiers(
      String branch,
      ProductPackageType product,
      List<@Valid ExternalIdentifier> externalIdentifiers) {
    Set<MappingRefset> mandatoryMappingRefsets =
        models.getModelConfiguration(branch).getMappings().stream()
            .filter(MappingRefset::isMandatory)
            .filter(mr -> mr.getLevel().equals(product))
            .collect(Collectors.toSet());

    // validate the external identifiers
    if (externalIdentifiers != null) {
      Map<String, MappingRefset> mappingRefsets =
          models.getModelConfiguration(branch).getMappings().stream()
              .filter(mr -> mr.getLevel().equals(product))
              .collect(
                  Collectors.toMap(
                      MappingRefset::getName,
                      Function.identity(),
                      (existing, replacement) -> {
                        throw new IllegalStateException(
                            "Duplicate key found for " + existing.getName());
                      }));

      Set<String> populatedSchemes =
          externalIdentifiers.stream()
              .map(ExternalIdentifier::getIdentifierScheme)
              .collect(Collectors.toSet());

      if (!populatedSchemes.containsAll(
          mandatoryMappingRefsets.stream()
              .map(MappingRefset::getName)
              .collect(Collectors.toSet()))) {
        throw new ProductAtomicDataValidationProblem(
            "External identifiers for schemes "
                + mandatoryMappingRefsets.stream()
                    .map(MappingRefset::getName)
                    .collect(Collectors.joining(", "))
                + " must be populated for this product");
      }

      externalIdentifiers.stream()
          .collect(Collectors.toMap(ExternalIdentifier::getIdentifierScheme, e -> 1, Integer::sum))
          .forEach(
              (key, value) -> {
                MappingRefset refset = mappingRefsets.get(key);

                if (refset == null) {
                  throw new ProductAtomicDataValidationProblem(
                      "External identifier scheme " + key + " is not valid for this product");
                } else if (!refset.isMultiValued() && value > 1) {
                  throw new ProductAtomicDataValidationProblem(
                      "External identifier scheme " + key + " is not multi-valued");
                }
              });

      for (ExternalIdentifier externalIdentifier : externalIdentifiers) {
        validateExternalIdentifier(externalIdentifier, mappingRefsets);
      }
    } else if (!mandatoryMappingRefsets.isEmpty()) {
      throw new ProductAtomicDataValidationProblem(
          "External identifiers for schemes "
              + mandatoryMappingRefsets.stream()
                  .map(MappingRefset::getTitle)
                  .collect(Collectors.joining(", "))
              + " must be populated for this product");
    }
  }

  private void validateIngredient(Ingredient ingredient) {
    boolean activeIngredientPopulated = ingredient.getActiveIngredient() != null;
    boolean preciseIngredientPopulated = ingredient.getPreciseIngredient() != null;
    boolean bossPopulated = ingredient.getBasisOfStrengthSubstance() != null;

    // BoSS is only populated if the active ingredient is populated
    if (!activeIngredientPopulated && bossPopulated) {
      throw new ProductAtomicDataValidationProblem(
          "Basis of strength substance can only be populated if active ingredient is populated");
    }

    // precise ingredient is only populated if active ingredient is populated
    if (!activeIngredientPopulated && preciseIngredientPopulated) {
      throw new ProductAtomicDataValidationProblem(
          "Precise ingredient can only be populated if active ingredient is populated");
    }

    // if BoSS is populated then total quantity or concentration strength must be populated
    boolean totalQuantityPopulated = ingredient.getTotalQuantity() != null;
    boolean concentrationStrengthPopulated = ingredient.getConcentrationStrength() != null;
    if (bossPopulated && !totalQuantityPopulated && !concentrationStrengthPopulated) {
      throw new ProductAtomicDataValidationProblem(
          "Basis of strength substance is populated but neither total quantity or concentration strength are populated");
    }

    // active ingredient is mandatory
    if (!activeIngredientPopulated) {
      throw new ProductAtomicDataValidationProblem("Active ingredient must be populated");
    }
  }

  private void validatePackageDetails(
      PackageDetails<MedicationProductDetails> packageDetails, String branch) {
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

    validateExternalIdentifiers(branch, PACKAGE, packageDetails.getExternalIdentifiers());
  }
}
