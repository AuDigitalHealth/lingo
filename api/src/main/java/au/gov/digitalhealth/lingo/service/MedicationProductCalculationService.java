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
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_CONTAINER_TYPE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_DEVICE_TYPE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_OTHER_IDENTIFYING_INFORMATION;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_TOTAL_QUANTITY_UNIT;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_TOTAL_QUANTITY_VALUE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.NO_OII_VALUE;
import static au.gov.digitalhealth.lingo.util.NonDefiningPropertiesConverter.calculateNonDefiningRelationships;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CONTAINS_CD;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.COUNT_OF_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.COUNT_OF_BASE_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_BOSS;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_CONCENTRATION_STRENGTH_DENOMINATOR_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_CONCENTRATION_STRENGTH_DENOMINATOR_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_CONCENTRATION_STRENGTH_NUMERATOR_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_CONCENTRATION_STRENGTH_NUMERATOR_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_MANUFACTURED_DOSE_FORM;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRECISE_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRESENTATION_STRENGTH_DENOMINATOR_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRESENTATION_STRENGTH_DENOMINATOR_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRESENTATION_STRENGTH_NUMERATOR_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRESENTATION_STRENGTH_NUMERATOR_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRODUCT_NAME;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.IS_A;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MEDICINAL_PRODUCT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MEDICINAL_PRODUCT_PACKAGE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.STATED_RELATIONSHIP;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.addQuantityIfNotNull;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.addRelationshipIfNotNull;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSnowstormDatatypeComponent;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSnowstormRelationship;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormConcreteValue.DataTypeEnum;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.Edge;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.*;
import au.gov.digitalhealth.lingo.product.details.properties.ReferenceSet;
import au.gov.digitalhealth.lingo.service.validators.MedicationDetailsValidator;
import au.gov.digitalhealth.lingo.util.AmtConstants;
import au.gov.digitalhealth.lingo.util.BigDecimalFormatter;
import au.gov.digitalhealth.lingo.util.OwlAxiomService;
import au.gov.digitalhealth.lingo.util.RelationshipSorter;
import au.gov.digitalhealth.lingo.util.SnomedConstants;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import au.gov.digitalhealth.tickets.service.TicketServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

@Service
@Log
public class MedicationProductCalculationService {

  private final Map<String, MedicationDetailsValidator> medicationDetailsValidatorByQualifier;
  SnowstormClient snowstormClient;
  NameGenerationService nameGenerationService;
  TicketServiceImpl ticketService;
  OwlAxiomService owlAxiomService;
  ObjectMapper objectMapper;
  NodeGeneratorService nodeGeneratorService;
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
      Models models,
      Map<String, MedicationDetailsValidator> medicationDetailsValidatorByQualifier) {
    this.snowstormClient = snowstormClient;
    this.nameGenerationService = nameGenerationService;
    this.ticketService = ticketService;
    this.owlAxiomService = owlAxiomService;
    this.objectMapper = objectMapper;
    this.nodeGeneratorService = nodeGeneratorService;
    this.models = models;
    this.medicationDetailsValidatorByQualifier = medicationDetailsValidatorByQualifier;
  }

  private static void addParent(Node mpuuNode, Node mpNode, String moduleId) {
    if (mpuuNode.isNewConcept()) {
      mpuuNode
          .getNewConceptDetails()
          .getAxioms()
          .forEach(
              a -> a.getRelationships().add(getSnowstormRelationship(IS_A, mpNode, 0, moduleId)));
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

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    ProductSummary productSummary = new ProductSummary();

    Mono<List<String>> taskChangedConceptIds = snowstormClient.getConceptIdsChangedOnTask(branch);

    Mono<List<String>> projectChangedConceptIds =
        snowstormClient.getConceptIdsChangedOnProject(branch);

    final MedicationDetailsValidator medicationDetailsValidator =
        medicationDetailsValidatorByQualifier.get(
            modelConfiguration.getModelType().name()
                + "-"
                + MedicationDetailsValidator.class.getSimpleName());

    if (medicationDetailsValidator == null) {
      throw new IllegalStateException(
          "No medication details validator found for model type: "
              + modelConfiguration.getModelType());
    }
    medicationDetailsValidator.validatePackageDetails(packageDetails, branch);

    Map<PackageQuantity<MedicationProductDetails>, ProductSummary> innerPackageSummaries =
        new HashMap<>();
    for (PackageQuantity<MedicationProductDetails> packageQuantity :
        packageDetails.getContainedPackages()) {
      ProductSummary innerPackageSummary =
          calculateCreatePackage(branch, packageQuantity.getPackageDetails(), atomicCache);
      innerPackageSummaries.put(packageQuantity, innerPackageSummary);
    }

    Map<ProductQuantity<MedicationProductDetails>, ProductSummary> innnerProductSummaries =
        new HashMap<>();
    for (ProductQuantity<MedicationProductDetails> productQuantity :
        packageDetails.getContainedProducts()) {
      ProductSummary innerProductSummary =
          createProduct(
              branch,
              productQuantity.getProductDetails(),
              atomicCache,
              packageDetails.getSelectedConceptIdentifiers());
      innnerProductSummaries.put(productQuantity, innerProductSummary);
    }

    Set<ModelLevel> packageLevels = modelConfiguration.getPackageLevels();

    Set<CompletableFuture<Node>> packageLevelFutures = new HashSet<>();
    for (ModelLevel packageLevel : packageLevels) {
      packageLevelFutures.add(
          getOrCreatePackagedClinicalDrug(
                  branch,
                  packageDetails,
                  innerPackageSummaries,
                  innnerProductSummaries,
                  packageLevel,
                  atomicCache)
              .thenApply(
                  n -> {
                    nameGenerationService.addGeneratedFsnAndPt(
                        atomicCache,
                        packageDetails.hasDeviceType()
                            ? packageLevel.getDrugDeviceSemanticTag()
                            : packageLevel.getMedicineSemanticTag(),
                        n,
                        modelConfiguration.getModuleId());
                    productSummary.addNode(n);
                    return n;
                  }));
    }

    Map<ModelLevelType, Node> packageNodeMap =
        packageLevelFutures.stream()
            .map(CompletableFuture::join)
            .collect(Collectors.toMap(Node::getModelLevel, n -> n));

    for (Node node : packageNodeMap.values()) {
      for (ModelLevel modelLevelType :
          modelConfiguration.getParentModelLevels(node.getModelLevel())) {
        Node parentNode = packageNodeMap.get(modelLevelType.getModelLevelType());
        if (parentNode != null) {
          addParent(node, parentNode, modelConfiguration.getModuleId());
          productSummary.addEdge(
              node.getConceptId(), parentNode.getConceptId(), ProductSummaryService.IS_A_LABEL);
        }
      }
    }

    productSummary.setSingleSubject(
        packageNodeMap.get(modelConfiguration.getLeafPackageModelLevel().getModelLevelType()));

    if (modelConfiguration.getModelType().equals(ModelType.AMT)
        || packageDetails.getProductName() != null) {
      productSummary.addNode(
          packageDetails.getProductName(),
          modelConfiguration.getLevelOfType(ModelLevelType.PRODUCT_NAME));
      for (Node node : packageNodeMap.values()) {
        if (node.getModelLevel().isBranded()) {
          productSummary.addEdge(
              node.getConceptId(),
              packageDetails.getProductName().getConceptId(),
              ProductSummaryService.HAS_PRODUCT_NAME_LABEL);
        }
      }
    }

    for (ProductSummary summary : innerPackageSummaries.values()) {
      productSummary.addSummary(summary);

      for (Node packageNode : packageNodeMap.values()) {
        productSummary.addEdge(
            packageNode.getConceptId(),
            summary
                .getSingleConceptWithLabel(
                    modelConfiguration.getLevelOfType(packageNode.getModelLevel()).getName())
                .getConceptId(),
            ProductSummaryService.CONTAINS_LABEL);
      }
    }

    for (ProductSummary summary : innnerProductSummaries.values()) {
      productSummary.addSummary(summary);

      for (Node packageNode : packageNodeMap.values()) {
        productSummary.addEdge(
            packageNode.getConceptId(),
            summary
                .getSingleConceptWithLabel(
                    modelConfiguration
                        .getContainedLevelForType(packageNode.getModelLevel())
                        .getDisplayLabel())
                .getConceptId(),
            ProductSummaryService.CONTAINS_LABEL);
      }
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
      ModelLevel packageLevel,
      AtomicCache atomicCache) {

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    String label =
        packageDetails.hasDeviceType()
            ? packageLevel.getDrugDeviceSemanticTag()
            : packageLevel.getMedicineSemanticTag();
    Set<String> refsets = Set.of(packageLevel.getReferenceSetIdentifier());
    ModelLevelType modelLevelType = packageLevel.getModelLevelType();

    Set<SnowstormRelationship> relationships =
        createPackagedClinicalDrugRelationships(
            packageDetails,
            innerPackageSummaries,
            innnerProductSummaries,
            packageLevel.isBranded(),
            packageLevel.isContainerized(),
            modelConfiguration);

    // todo remove this once using transformed nmpc data
    boolean enforceRefsets = modelConfiguration.getModelType().equals(ModelType.AMT);

    return nodeGeneratorService.generateNodeAsync(
        branch,
        atomicCache,
        relationships,
        refsets,
        packageLevel,
        label,
        getReferenceSetMembers(
            packageDetails, models.getModelConfiguration(branch), PACKAGE, modelLevelType),
        calculateNonDefiningRelationships(
            models.getModelConfiguration(branch), packageDetails, modelLevelType),
        packageDetails.getSelectedConceptIdentifiers(),
        true,
        label.equals(
            modelConfiguration.getLevelOfType(ModelLevelType.PACKAGED_CLINICAL_DRUG).getName()),
        enforceRefsets);
  }

  private Set<SnowstormRelationship> createPackagedClinicalDrugRelationships(
      PackageDetails<MedicationProductDetails> packageDetails,
      Map<PackageQuantity<MedicationProductDetails>, ProductSummary> innerPackageSummaries,
      Map<ProductQuantity<MedicationProductDetails>, ProductSummary> innnerProductSummaries,
      boolean branded,
      boolean container,
      ModelConfiguration modelConfiguration) {

    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(
        getSnowstormRelationship(
            IS_A, MEDICINAL_PRODUCT_PACKAGE, 0, modelConfiguration.getModuleId()));

    if (modelConfiguration.getModelType().equals(ModelType.AMT) && branded && container) {
      addRelationshipIfNotNull(
          relationships,
          packageDetails.getContainerType(),
          HAS_CONTAINER_TYPE,
          0,
          modelConfiguration.getModuleId());
    }

    if (branded) {
      addRelationshipIfNotNull(
          relationships,
          packageDetails.getProductName(),
          HAS_PRODUCT_NAME,
          0,
          modelConfiguration.getModuleId());
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
      relationships.add(
          getSnowstormRelationship(
              CONTAINS_CD, contained, group, modelConfiguration.getModuleId()));

      ProductQuantity<MedicationProductDetails> quantity = entry.getKey();
      relationships.add(
          getSnowstormRelationship(
              HAS_PACK_SIZE_UNIT,
              quantity.getUnit(),
              group,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
      relationships.add(
          getSnowstormDatatypeComponent(
              HAS_PACK_SIZE_VALUE,
              BigDecimalFormatter.formatBigDecimal(quantity.getValue(), decimalScale),
              DataTypeEnum.DECIMAL,
              group,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));

      if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
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
                STATED_RELATIONSHIP,
                modelConfiguration.getModuleId()));
      }

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
      relationships.add(
          getSnowstormRelationship(
              CONTAINS_PACKAGED_CD, contained, group, modelConfiguration.getModuleId()));

      PackageQuantity<MedicationProductDetails> quantity = entry.getKey();
      relationships.add(
          getSnowstormRelationship(
              HAS_PACK_SIZE_UNIT,
              quantity.getUnit(),
              group,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
      relationships.add(
          getSnowstormDatatypeComponent(
              HAS_PACK_SIZE_VALUE,
              BigDecimalFormatter.formatBigDecimal(quantity.getValue(), decimalScale),
              DataTypeEnum.DECIMAL,
              group,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
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
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
    }

    return relationships;
  }

  private ProductSummary createProduct(
      String branch,
      MedicationProductDetails productDetails,
      AtomicCache atomicCache,
      List<String> selectedConceptIdentifiers)
      throws ExecutionException, InterruptedException {

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    ProductSummary productSummary = new ProductSummary();

    // todo refactoring still required here - remove work arounds
    ModelLevel mpLevel =
        modelConfiguration.getLevelOfType(
            modelConfiguration.getModelType().equals(ModelType.AMT)
                ? ModelLevelType.MEDICINAL_PRODUCT
                : ModelLevelType.MEDICINAL_PRODUCT_ONLY);

    CompletableFuture<Node> mp =
        findOrCreateMp(branch, productDetails, atomicCache, selectedConceptIdentifiers, mpLevel)
            .thenApply(
                n -> {
                  nameGenerationService.addGeneratedFsnAndPt(
                      atomicCache,
                      productDetails.hasDeviceType()
                          ? mpLevel.getDrugDeviceSemanticTag()
                          : mpLevel.getMedicineSemanticTag(),
                      n,
                      modelConfiguration.getModuleId());
                  productSummary.addNode(n);
                  return n;
                });

    ModelLevel mpuuLevel = modelConfiguration.getLevelOfType(ModelLevelType.CLINICAL_DRUG);

    CompletableFuture<Node> mpuu =
        findOrCreateUnit(
                branch, productDetails, null, atomicCache, selectedConceptIdentifiers, mpuuLevel)
            .thenApply(
                n -> {
                  nameGenerationService.addGeneratedFsnAndPt(
                      atomicCache,
                      productDetails.hasDeviceType()
                          ? mpuuLevel.getDrugDeviceSemanticTag()
                          : mpuuLevel.getMedicineSemanticTag(),
                      n,
                      modelConfiguration.getModuleId());
                  productSummary.addNode(n);
                  return n;
                });

    CompletableFuture.allOf(mp, mpuu).get();

    Node mpNode = mp.get();
    Node mpuuNode = mpuu.get();

    ModelLevel tpuuLevel = modelConfiguration.getLevelOfType(ModelLevelType.REAL_CLINICAL_DRUG);

    CompletableFuture<Node> tpuu =
        findOrCreateUnit(
                branch, productDetails, null, atomicCache, selectedConceptIdentifiers, tpuuLevel)
            .thenApply(
                n -> {
                  nameGenerationService.addGeneratedFsnAndPt(
                      atomicCache,
                      productDetails.hasDeviceType()
                          ? tpuuLevel.getDrugDeviceSemanticTag()
                          : tpuuLevel.getMedicineSemanticTag(),
                      n,
                      modelConfiguration.getModuleId());
                  productSummary.addNode(n);
                  return n;
                });
    Node tpuuNode = tpuu.get();

    if (modelConfiguration.getModelType().equals(ModelType.NMPC)) {
      ModelLevel atmLevel =
          modelConfiguration.getLevelOfType(ModelLevelType.REAL_MEDICINAL_PRODUCT);
      CompletableFuture<Node> atm =
          findOrCreateAtm(branch, productDetails, atomicCache, selectedConceptIdentifiers, atmLevel)
              .thenApply(
                  n -> {
                    nameGenerationService.addGeneratedFsnAndPt(
                        atomicCache,
                        productDetails.hasDeviceType()
                            ? atmLevel.getDrugDeviceSemanticTag()
                            : atmLevel.getMedicineSemanticTag(),
                        n,
                        modelConfiguration.getModuleId());
                    productSummary.addNode(n);
                    return n;
                  });
      Node atmNode = atm.get();
      addParent(tpuuNode, atmNode, modelConfiguration.getModuleId());
      productSummary.addEdge(
          tpuuNode.getConceptId(), atmNode.getConceptId(), ProductSummaryService.IS_A_LABEL);
    }

    addParent(mpuuNode, mpNode, modelConfiguration.getModuleId());

    productSummary.addEdge(
        mpuuNode.getConceptId(), mpNode.getConceptId(), ProductSummaryService.IS_A_LABEL);
    productSummary.addEdge(
        tpuuNode.getConceptId(), mpuuNode.getConceptId(), ProductSummaryService.IS_A_LABEL);

    if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
      productSummary.addNode(
          productDetails.getProductName(),
          modelConfiguration.getLevelOfType(ModelLevelType.PRODUCT_NAME));
      productSummary.addEdge(
          tpuuNode.getConceptId(),
          productDetails.getProductName().getConceptId(),
          ProductSummaryService.HAS_PRODUCT_NAME_LABEL);
    }

    productSummary.setSingleSubject(tpuuNode);

    return productSummary;
  }

  private CompletableFuture<Node> findOrCreateAtm(
      String branch,
      MedicationProductDetails productDetails,
      AtomicCache atomicCache,
      List<String> selectedConceptIdentifiers,
      ModelLevel atmLevel) {
    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    Set<SnowstormRelationship> relationships =
        createAtmRelationships(productDetails, modelConfiguration);

    return nodeGeneratorService.generateNodeAsync(
        branch,
        atomicCache,
        relationships,
        Set.of(atmLevel.getReferenceSetIdentifier()),
        atmLevel,
        productDetails.hasDeviceType()
            ? atmLevel.getDrugDeviceSemanticTag()
            : atmLevel.getMedicineSemanticTag(),
        getReferenceSetMembers(
            productDetails,
            models.getModelConfiguration(branch),
            PRODUCT,
            atmLevel.getModelLevelType()),
        calculateNonDefiningRelationships(
            models.getModelConfiguration(branch), productDetails, atmLevel.getModelLevelType()),
        selectedConceptIdentifiers,
        false,
        true,
        false);
  }

  private Set<SnowstormRelationship> createAtmRelationships(
      MedicationProductDetails productDetails, ModelConfiguration modelConfiguration) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(
        getSnowstormRelationship(IS_A, MEDICINAL_PRODUCT, 0, modelConfiguration.getModuleId()));
    int group = 1;
    for (Ingredient ingredient : productDetails.getActiveIngredients()) {
      relationships.add(
          getSnowstormRelationship(
              HAS_ACTIVE_INGREDIENT,
              ingredient.getActiveIngredient(),
              group,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
      group++;
    }
    relationships.add(
        getSnowstormRelationship(
            HAS_PRODUCT_NAME,
            productDetails.getProductName(),
            0,
            STATED_RELATIONSHIP,
            modelConfiguration.getModuleId()));
    return relationships;
  }

  private CompletableFuture<Node> findOrCreateUnit(
      String branch,
      MedicationProductDetails productDetails,
      Node parent,
      AtomicCache atomicCache,
      List<String> selectedConceptIdentifiers,
      ModelLevel level) {

    boolean branded = level.isBranded();

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    ModelLevelType modelLevelType = level.getModelLevelType();
    Set<String> referencedIds = Set.of(level.getReferenceSetIdentifier());

    Set<SnowstormRelationship> relationships =
        createClinicalDrugRelationships(productDetails, parent, branded, modelConfiguration);

    boolean enforceRefsets = modelConfiguration.getModelType().equals(ModelType.AMT);

    return nodeGeneratorService.generateNodeAsync(
        branch,
        atomicCache,
        relationships,
        referencedIds,
        level,
        productDetails.hasDeviceType()
            ? level.getDrugDeviceSemanticTag()
            : level.getMedicineSemanticTag(),
        getReferenceSetMembers(
            productDetails, models.getModelConfiguration(branch), PRODUCT, modelLevelType),
        calculateNonDefiningRelationships(
            models.getModelConfiguration(branch), productDetails, modelLevelType),
        selectedConceptIdentifiers,
        !branded,
        false,
        enforceRefsets);
  }

  private CompletableFuture<Node> findOrCreateMp(
      String branch,
      MedicationProductDetails details,
      AtomicCache atomicCache,
      List<String> selectedConceptIdentifiers,
      ModelLevel mpLevel) {

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    Set<SnowstormRelationship> relationships = createMpRelationships(details, modelConfiguration);

    if (mpLevel.getModelLevelType().equals(ModelLevelType.MEDICINAL_PRODUCT_ONLY)) {
      relationships.add(
          getSnowstormDatatypeComponent(
              SnomedConstants.COUNT_OF_BASE_ACTIVE_INGREDIENT,
              Integer.toString(
                  details.getActiveIngredients().stream()
                      .map(i -> i.getBasisOfStrengthSubstance().getConceptId())
                      .collect(Collectors.toSet())
                      .size()),
              DataTypeEnum.INTEGER,
              0,
              SnomedConstants.STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
    }

    return nodeGeneratorService.generateNodeAsync(
        branch,
        atomicCache,
        relationships,
        Set.of(mpLevel.getReferenceSetIdentifier()),
        mpLevel,
        details.hasDeviceType()
            ? mpLevel.getDrugDeviceSemanticTag()
            : mpLevel.getMedicineSemanticTag(),
        getReferenceSetMembers(
            details,
            models.getModelConfiguration(branch),
            PRODUCT,
            ModelLevelType.MEDICINAL_PRODUCT),
        calculateNonDefiningRelationships(
            models.getModelConfiguration(branch), details, ModelLevelType.MEDICINAL_PRODUCT),
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
      MedicationProductDetails productDetails,
      Node parent,
      boolean branded,
      ModelConfiguration modelConfiguration) {
    Set<SnowstormRelationship> relationships = new HashSet<>();

    if (parent != null) {
      relationships.add(
          getSnowstormRelationship(IS_A, parent, 0, modelConfiguration.getModuleId()));
    } else {
      relationships.add(
          getSnowstormRelationship(IS_A, MEDICINAL_PRODUCT, 0, modelConfiguration.getModuleId()));
    }

    if (branded) {
      relationships.add(
          getSnowstormRelationship(
              HAS_PRODUCT_NAME,
              productDetails.getProductName(),
              0,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));

      if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
        relationships.add(
            getSnowstormDatatypeComponent(
                HAS_OTHER_IDENTIFYING_INFORMATION,
                !StringUtils.hasLength(productDetails.getOtherIdentifyingInformation())
                    ? NO_OII_VALUE.getValue()
                    : productDetails.getOtherIdentifyingInformation(),
                DataTypeEnum.STRING,
                0,
                STATED_RELATIONSHIP,
                modelConfiguration.getModuleId()));
      }
    }

    if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
      addRelationshipIfNotNull(
          relationships,
          productDetails.getContainerType(),
          HAS_CONTAINER_TYPE,
          0,
          modelConfiguration.getModuleId());
      addRelationshipIfNotNull(
          relationships,
          productDetails.getDeviceType(),
          HAS_DEVICE_TYPE,
          0,
          modelConfiguration.getModuleId());
    }

    SnowstormConceptMini doseForm =
        productDetails.getGenericForm() == null ? null : productDetails.getGenericForm();

    if (branded) {
      doseForm =
          productDetails.getSpecificForm() == null ? doseForm : productDetails.getSpecificForm();
    }

    if (doseForm != null) {
      relationships.add(
          getSnowstormRelationship(
              HAS_MANUFACTURED_DOSE_FORM,
              doseForm,
              0,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
    }

    if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
      addQuantityIfNotNull(
          productDetails.getQuantity(),
          decimalScale,
          relationships,
          HAS_PACK_SIZE_VALUE,
          HAS_PACK_SIZE_UNIT,
          DataTypeEnum.DECIMAL,
          0,
          modelConfiguration.getModuleId());
    }

    int group = 1;
    for (Ingredient ingredient : productDetails.getActiveIngredients()) {
      addRelationshipIfNotNull(
          relationships,
          ingredient.getActiveIngredient(),
          HAS_ACTIVE_INGREDIENT,
          group,
          modelConfiguration.getModuleId());
      addRelationshipIfNotNull(
          relationships,
          ingredient.getPreciseIngredient(),
          HAS_PRECISE_ACTIVE_INGREDIENT,
          group,
          modelConfiguration.getModuleId());
      addRelationshipIfNotNull(
          relationships,
          ingredient.getBasisOfStrengthSubstance(),
          HAS_BOSS,
          group,
          modelConfiguration.getModuleId());
      if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
        addQuantityIfNotNull(
            ingredient.getTotalQuantity(),
            decimalScale,
            relationships,
            HAS_TOTAL_QUANTITY_VALUE,
            HAS_TOTAL_QUANTITY_UNIT,
            DataTypeEnum.DECIMAL,
            group,
            modelConfiguration.getModuleId());
        addQuantityIfNotNull(
            ingredient.getConcentrationStrength(),
            decimalScale,
            relationships,
            CONCENTRATION_STRENGTH_VALUE,
            CONCENTRATION_STRENGTH_UNIT,
            DataTypeEnum.DECIMAL,
            group,
            modelConfiguration.getModuleId());
      } else {
        addQuantityIfNotNull(
            ingredient.getPresentationStrengthNumerator(),
            decimalScale,
            relationships,
            HAS_PRESENTATION_STRENGTH_NUMERATOR_VALUE,
            HAS_PRESENTATION_STRENGTH_NUMERATOR_UNIT,
            DataTypeEnum.DECIMAL,
            group,
            modelConfiguration.getModuleId());
        addQuantityIfNotNull(
            ingredient.getPresentationStrengthDenominator(),
            decimalScale,
            relationships,
            HAS_PRESENTATION_STRENGTH_DENOMINATOR_VALUE,
            HAS_PRESENTATION_STRENGTH_DENOMINATOR_UNIT,
            DataTypeEnum.DECIMAL,
            group,
            modelConfiguration.getModuleId());
        addQuantityIfNotNull(
            ingredient.getConcentrationStrengthNumerator(),
            decimalScale,
            relationships,
            HAS_CONCENTRATION_STRENGTH_NUMERATOR_VALUE,
            HAS_CONCENTRATION_STRENGTH_NUMERATOR_UNIT,
            DataTypeEnum.DECIMAL,
            group,
            modelConfiguration.getModuleId());
        addQuantityIfNotNull(
            ingredient.getConcentrationStrengthDenominator(),
            decimalScale,
            relationships,
            HAS_CONCENTRATION_STRENGTH_DENOMINATOR_VALUE,
            HAS_CONCENTRATION_STRENGTH_DENOMINATOR_UNIT,
            DataTypeEnum.DECIMAL,
            group,
            modelConfiguration.getModuleId());
      }

      group++;
    }

    // MPUUs/CDs use "some" semantics, TPUUs/BCDs use "only" semantics
    if (modelConfiguration.getModelType().equals(ModelType.AMT)
        && branded
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
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
    } else if (modelConfiguration.getModelType().equals(ModelType.NMPC)
        && productDetails.getActiveIngredients() != null
        && !productDetails.getActiveIngredients().isEmpty()) {

      relationships.add(
          getSnowstormDatatypeComponent(
              COUNT_OF_BASE_ACTIVE_INGREDIENT,
              // get the unique set of active ingredients
              Integer.toString(
                  productDetails.getActiveIngredients().stream()
                      .map(i -> i.getBasisOfStrengthSubstance().getConceptId())
                      .collect(Collectors.toSet())
                      .size()),
              DataTypeEnum.INTEGER,
              0,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
    }

    return relationships;
  }

  private Set<SnowstormRelationship> createMpRelationships(
      MedicationProductDetails productDetails, ModelConfiguration modelConfiguration) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(
        getSnowstormRelationship(IS_A, MEDICINAL_PRODUCT, 0, modelConfiguration.getModuleId()));
    int group = 1;
    for (Ingredient ingredient : productDetails.getActiveIngredients()) {
      relationships.add(
          getSnowstormRelationship(
              HAS_ACTIVE_INGREDIENT,
              ingredient.getActiveIngredient(),
              group,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
      group++;
    }
    return relationships;
  }
}
