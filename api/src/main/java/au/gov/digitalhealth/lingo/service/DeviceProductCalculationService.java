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

import static au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType.CLINICAL_DRUG;
import static au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType.REAL_CLINICAL_DRUG;
import static au.gov.digitalhealth.lingo.util.AmtConstants.CONTAINS_DEVICE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.COUNT_OF_DEVICE_TYPE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_CONTAINER_TYPE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_OTHER_IDENTIFYING_INFORMATION;
import static au.gov.digitalhealth.lingo.util.AmtConstants.NO_OII_VALUE;
import static au.gov.digitalhealth.lingo.util.NonDefiningPropertiesConverter.calculateNonDefiningRelationships;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRODUCT_NAME;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.IS_A;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.PACKAGE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.PRIMITIVE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.STATED_RELATIONSHIP;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.UNIT_OF_PRESENTATION;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSnowstormDatatypeComponent;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSnowstormRelationship;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
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
import au.gov.digitalhealth.lingo.product.Edge;
import au.gov.digitalhealth.lingo.product.NewConceptDetails;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.DeviceProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.ProductQuantity;
import au.gov.digitalhealth.lingo.service.validators.DeviceDetailsValidator;
import au.gov.digitalhealth.lingo.util.AmtConstants;
import au.gov.digitalhealth.lingo.util.BigDecimalFormatter;
import au.gov.digitalhealth.lingo.util.SnomedConstants;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

@Service
public class DeviceProductCalculationService {

  private final Models models;
  private final Map<String, DeviceDetailsValidator> deviceDetailsValidatorByQualifier;
  SnowstormClient snowstormClient;
  NodeGeneratorService nodeGeneratorService;

  @Value("${snomio.decimal-scale}")
  int decimalScale;

  public DeviceProductCalculationService(
      SnowstormClient snowstormClient,
      NodeGeneratorService nodeGeneratorService,
      Models models,
      Map<String, DeviceDetailsValidator> deviceDetailsValidatorByQualifier) {
    this.snowstormClient = snowstormClient;
    this.nodeGeneratorService = nodeGeneratorService;
    this.models = models;
    this.deviceDetailsValidatorByQualifier = deviceDetailsValidatorByQualifier;
  }

  private static Set<SnowstormRelationship> getLeafBrandedProductRelationships(
      Node mpuu, DeviceProductDetails productDetails, ModelConfiguration modelConfiguration) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A, mpuu, 0, modelConfiguration.getModuleId()));
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
    return relationships;
  }

  private static Set<SnowstormRelationship> getAtmRelationships(
      Node rootUnbrandedProductNode,
      @NotNull SnowstormConceptMini productName,
      @NotEmpty String moduleId) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A, rootUnbrandedProductNode, 0, moduleId));
    relationships.add(
        getSnowstormRelationship(HAS_PRODUCT_NAME, productName, 0, STATED_RELATIONSHIP, moduleId));
    return relationships;
  }

  private static Set<SnowstormRelationship> getLeafUnbrandedRelationships(
      Node rootUnbrandedNode, Set<SnowstormConceptMini> otherParentConcepts, String moduleId) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A, rootUnbrandedNode, 0, moduleId));
    if (otherParentConcepts != null) {
      otherParentConcepts.forEach(
          otherParentConcept ->
              relationships.add(
                  getSnowstormRelationship(
                      IS_A, otherParentConcept, 0, STATED_RELATIONSHIP, moduleId)));
    }
    return relationships;
  }

  private static String generatePackTerm(
      Entry<ProductQuantity<DeviceProductDetails>, ProductSummary> entry, ModelLevelType type) {
    ProductSummary productSummary = entry.getValue();
    ProductQuantity<DeviceProductDetails> productQuantity = entry.getKey();
    return productSummary
            .getNode(productSummary.getSingleConceptOfType(type).getConceptId())
            .getPreferredTerm()
        + ", "
        + productQuantity.getValue()
        + (UNIT_OF_PRESENTATION.getValue().equals(productQuantity.getUnit().getConceptId()))
            ? ""
            : " "
                + Objects.requireNonNull(
                        productQuantity.getUnit().getPt(), "Unit must have a preferred term")
                    .getTerm());
  }

  public ProductSummary calculateProductFromAtomicData(
      String branch, @Valid PackageDetails<@Valid DeviceProductDetails> packageDetails) {

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    Mono<List<String>> taskChangedConceptIds = snowstormClient.getConceptIdsChangedOnTask(branch);

    Mono<List<String>> projectChangedConceptIds =
        snowstormClient.getConceptIdsChangedOnProject(branch);

    AtomicCache cache =
        new AtomicCache(
            packageDetails.getIdFsnMap(), AmtConstants.values(), SnomedConstants.values());

    final DeviceDetailsValidator deviceDetailsValidator =
        deviceDetailsValidatorByQualifier.get(
            modelConfiguration.getModelType().name()
                + "-"
                + DeviceDetailsValidator.class.getSimpleName());

    if (deviceDetailsValidator == null) {
      throw new IllegalStateException(
          "No device details validator found for model type: " + modelConfiguration.getModelType());
    }
    deviceDetailsValidator.validatePackageDetails(packageDetails, branch);

    ProductSummary productSummary = new ProductSummary();

    Map<ProductQuantity<DeviceProductDetails>, ProductSummary> innerProductSummaries =
        new HashMap<>();

    updateConceptReferences(branch, packageDetails);

    for (ProductQuantity<DeviceProductDetails> productQuantity :
        packageDetails.getContainedProducts()) {
      ProductSummary innerProductSummary =
          createSummaryForContainedProduct(branch, packageDetails, productQuantity, cache);

      innerProductSummaries.put(productQuantity, innerProductSummary);
      productSummary.addSummary(innerProductSummary);
    }

    Map<ModelLevelType, CompletableFuture<Node>> packageLevelNodes = new EnumMap<>(ModelLevelType.class);
    modelConfiguration
        .getPackageLevels()
        .forEach(
            level -> packageLevelNodes.put(
                level.getModelLevelType(),
                getPackageNode(
                    branch, packageDetails, cache, innerProductSummaries, productSummary, level)));

    CompletableFuture.allOf(packageLevelNodes.values().toArray(CompletableFuture[]::new)).join();

    packageLevelNodes.forEach(
        (type, nodeFuture) -> {
          Node node = nodeFuture.join();
          if (node.isNewConcept()) {
            String mppPreferredTerm =
                calculatePreferredTerm(
                    innerProductSummaries, type, packageDetails.getContainerType());
            node.getNewConceptDetails().setPreferredTerm(mppPreferredTerm);
            node.getNewConceptDetails()
                .setFullySpecifiedName(
                    mppPreferredTerm
                        + " ("
                        + modelConfiguration.getLevelOfType(type).getDeviceSemanticTag()
                        + ")");
          }

          if (modelConfiguration.getModelType().equals(ModelType.AMT) && type.isBranded()) {
            ModelLevel tpLevel = modelConfiguration.getLevelOfType(ModelLevelType.PRODUCT_NAME);
            productSummary.addNode(packageDetails.getProductName(), tpLevel);
            productSummary.addEdge(
                node.getConceptId(),
                packageDetails.getProductName().getConceptId(),
                ProductSummaryService.HAS_PRODUCT_NAME_LABEL);
          }
        });

    // once the names are set, we can add the isa relationships - names for new concepts are set
    // in these isa relationships and used in the diagram display
    packageLevelNodes.forEach(
        (type, nodeFuture) -> {
          Node node = nodeFuture.join();
          Set<ModelLevel> ancestorLevels = modelConfiguration.getAncestorModelLevels(type);
          if (!ancestorLevels.isEmpty()) {
            Set<ModelLevel> parentLevels = ModelLevel.getLeafLevels(ancestorLevels);
            ancestorLevels.forEach(
                ancestorLevel -> {
                  Node ancestorNode =
                      packageLevelNodes.get(ancestorLevel.getModelLevelType()).join();
                  productSummary.addEdge(
                      node.getConceptId(),
                      ancestorNode.getConceptId(),
                      ProductSummaryService.IS_A_LABEL);
                  if (node.isNewConcept() && parentLevels.contains(ancestorLevel)) {
                    node.getNewConceptDetails()
                        .getAxioms()
                        .forEach(
                            axiom ->
                                axiom
                                    .getRelationships()
                                    .add(
                                        getSnowstormRelationship(
                                            IS_A,
                                            ancestorNode,
                                            0,
                                            modelConfiguration.getModuleId())));
                  }
                });
          }
        });

    productSummary.setSingleSubject(
        packageLevelNodes
            .get(modelConfiguration.getLeafPackageModelLevel().getModelLevelType())
            .join());

    Set<Edge> transitiveContainsEdges =
        ProductSummaryService.getTransitiveEdges(productSummary, new HashSet<>());
    productSummary.getEdges().addAll(transitiveContainsEdges);

    productSummary.updateNodeChangeStatus(
        taskChangedConceptIds.block(), projectChangedConceptIds.block());

    return productSummary;
  }

  private void updateConceptReferences(
      String branch, @Valid PackageDetails<@Valid DeviceProductDetails> packageDetails) {
    Set<String> conceptIds = new HashSet<>();

    // Collect concept IDs from packageDetails
    addConceptIdIfNotNull(conceptIds, packageDetails.getProductName());
    addConceptIdIfNotNull(conceptIds, packageDetails.getContainerType());

    for (ProductQuantity<DeviceProductDetails> productQuantity :
        packageDetails.getContainedProducts()) {
      addConceptIdIfNotNull(conceptIds, productQuantity.getUnit());

      DeviceProductDetails details = productQuantity.getProductDetails();
      addConceptIdIfNotNull(conceptIds, details.getDeviceType());
      addConceptIdIfNotNull(conceptIds, details.getSpecificDeviceType());
      addConceptIdIfNotNull(conceptIds, details.getProductName());
      if (details.getOtherParentConcepts() != null) {
        details
            .getOtherParentConcepts()
            .forEach(concept -> addConceptIdIfNotNull(conceptIds, concept));
      }
    }

    Map<String, SnowstormConceptMini> conceptMiniMap =
        snowstormClient.getConceptsById(branch, conceptIds).stream()
            .collect(Collectors.toMap(SnowstormConceptMini::getConceptId, c -> c));

    // Assign looked-up concepts back to packageDetails
    packageDetails.setProductName(
        getConceptOrThrow(
            conceptMiniMap, packageDetails.getProductName(), "Product name concept not found: "));
    packageDetails.setContainerType(
        getConceptOrThrow(
            conceptMiniMap,
            packageDetails.getContainerType(),
            "Container type concept not found: "));

    for (ProductQuantity<DeviceProductDetails> productQuantity :
        packageDetails.getContainedProducts()) {
      productQuantity.setUnit(
          getConceptOrThrow(conceptMiniMap, productQuantity.getUnit(), "Unit concept not found: "));
      DeviceProductDetails details = productQuantity.getProductDetails();
      details.setDeviceType(
          getConceptOrThrow(
              conceptMiniMap, details.getDeviceType(), "Device type concept not found: "));
      details.setSpecificDeviceType(
          getConceptOrNull(conceptMiniMap, details.getSpecificDeviceType()));
      details.setProductName(getConceptOrNull(conceptMiniMap, details.getProductName()));
      if (details.getOtherParentConcepts() != null) {
        Set<SnowstormConceptMini> updatedParents =
            details.getOtherParentConcepts().stream()
                .map(concept -> getConceptOrNull(conceptMiniMap, concept))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        details.setOtherParentConcepts(updatedParents);
      }
    }
  }

  private void addConceptIdIfNotNull(Set<String> conceptIds, SnowstormConceptMini concept) {
    if (concept != null) {
      conceptIds.add(concept.getConceptId());
    }
  }

  private SnowstormConceptMini getConceptOrThrow(
      Map<String, SnowstormConceptMini> map, SnowstormConceptMini original, String errorMsg) {
    if (original == null) return null;
    SnowstormConceptMini lookedUp = map.get(original.getConceptId());
    if (lookedUp == null) {
      throw new IllegalArgumentException(errorMsg + original.getConceptId());
    }
    return lookedUp;
  }

  private SnowstormConceptMini getConceptOrNull(
      Map<String, SnowstormConceptMini> map, SnowstormConceptMini original) {
    if (original == null) return null;
    return getConceptOrThrow(map, original, "Concept not found: ");
  }

  private String calculatePreferredTerm(
      Map<ProductQuantity<DeviceProductDetails>, ProductSummary> innerProductSummaries,
      ModelLevelType type,
      SnowstormConceptMini containerType) {
    switch (type) {
      case PACKAGED_CLINICAL_DRUG -> {
        return innerProductSummaries.entrySet().stream()
            .map(entry -> generatePackTerm(entry, CLINICAL_DRUG))
            .collect(Collectors.joining(", "));
      }
      case REAL_PACKAGED_CLINICAL_DRUG -> {
        return innerProductSummaries.entrySet().stream()
            .map(entry -> generatePackTerm(entry, REAL_CLINICAL_DRUG))
            .collect(Collectors.joining(", "));
      }
      case REAL_CONTAINERIZED_PACKAGED_CLINICAL_DRUG -> {
        return innerProductSummaries.entrySet().stream()
            .map(entry -> generatePackTerm(entry, REAL_CLINICAL_DRUG))
            .collect(Collectors.joining(", "))
            .concat(", " + Objects.requireNonNull(containerType.getPt(), "Container type concept must have a preferred term").getTerm());
      }
      default -> throw new IllegalArgumentException("Invalid type: " + type);
    }
  }

  private CompletableFuture<Node> getPackageNode(
      String branch,
      PackageDetails<DeviceProductDetails> packageDetails,
      AtomicCache cache,
      Map<ProductQuantity<DeviceProductDetails>, ProductSummary> innerProductSummaries,
      ProductSummary productSummary,
      ModelLevel modelLevel) {

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers =
        SnowstormDtoUtil.getExternalIdentifierReferenceSetEntries(
            packageDetails.getExternalIdentifiers(),
            modelLevel.getModelLevelType(),
            models
                .getModelConfiguration(branch)
                .getMappingRefsetMapForType(
                    ProductPackageType.PACKAGE, ProductPackageType.CONTAINED_PACKAGE));

    ModelLevel containedLevel;
    if (modelLevel.getModelLevelType().isBranded()) {
      containedLevel = modelConfiguration.getLeafProductModelLevel();
    } else {
      containedLevel = modelConfiguration.getLeafUnbrandedProductModelLevel();
    }

    return nodeGeneratorService
        .generateNodeAsync(
            branch,
            cache,
            getPackageRelationships(
                modelLevel,
                packageDetails,
                innerProductSummaries,
                containedLevel,
                modelConfiguration),
            Set.of(modelLevel.getReferenceSetIdentifier()),
            modelLevel,
            modelLevel.getDeviceSemanticTag(),
            referenceSetMembers,
            calculateNonDefiningRelationships(
                models.getModelConfiguration(branch),
                packageDetails,
                modelLevel.getModelLevelType()),
            packageDetails.getSelectedConceptIdentifiers(),
            true,
            ModelLevelType.PACKAGED_CLINICAL_DRUG.equals(modelLevel.getModelLevelType()),
            true)
        .thenApply(
            n -> {
              productSummary.addNode(n);
              innerProductSummaries.forEach(
                  (productQuantity, innerProductSummary) ->
                      productSummary.addEdge(
                          n.getConceptId(),
                          innerProductSummary
                              .getSingleConceptOfType(containedLevel.getModelLevelType())
                              .getConceptId(),
                          ProductSummaryService.CONTAINS_LABEL));
              return n;
            });
  }

  private Set<SnowstormRelationship> getPackageRelationships(
      ModelLevel modelLevel,
      PackageDetails<DeviceProductDetails> packageDetails,
      Map<ProductQuantity<DeviceProductDetails>, ProductSummary> innerProductSummaries,
      ModelLevel containedType,
      ModelConfiguration modelConfiguration) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A, PACKAGE, 0, modelConfiguration.getModuleId()));
    int group = 1;
    for (Entry<ProductQuantity<DeviceProductDetails>, ProductSummary> innerProductSummaryEntry :
        innerProductSummaries.entrySet()) {
      relationships.add(
          getSnowstormRelationship(
              CONTAINS_DEVICE,
              innerProductSummaryEntry
                  .getValue()
                  .getSingleConceptOfType(containedType.getModelLevelType()),
              group,
              modelConfiguration.getModuleId()));
      relationships.add(
          getSnowstormRelationship(
              HAS_PACK_SIZE_UNIT,
              innerProductSummaryEntry.getKey().getUnit(),
              group,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
      relationships.add(
          getSnowstormDatatypeComponent(
              HAS_PACK_SIZE_VALUE,
              BigDecimalFormatter.formatBigDecimal(
                  innerProductSummaryEntry.getKey().getValue(),
                  decimalScale,
                  modelConfiguration.isTrimWholeNumbers()),
              DataTypeEnum.DECIMAL,
              group,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
      group++;
    }

    if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
      relationships.add(
          getSnowstormDatatypeComponent(
              COUNT_OF_DEVICE_TYPE,
              Integer.toString(innerProductSummaries.size()),
              DataTypeEnum.INTEGER,
              0,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
    }

    if (modelLevel.isBranded() && packageDetails.getProductName() != null) {
      relationships.add(
          getSnowstormRelationship(
              HAS_PRODUCT_NAME,
              packageDetails.getProductName(),
              group++,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
    }

    if (modelLevel.isContainerized()) {
      relationships.add(
          getSnowstormRelationship(
              HAS_CONTAINER_TYPE,
              packageDetails.getContainerType(),
              group,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
    }
    return relationships;
  }

  private ProductSummary createSummaryForContainedProduct(
      String branch,
      PackageDetails<DeviceProductDetails> packageDetails,
      ProductQuantity<DeviceProductDetails> productQuantity,
      AtomicCache cache) {

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    ProductSummary innerProductSummary = new ProductSummary();

    ModelLevel rootUnbrandedProductLevel = modelConfiguration.getRootUnbrandedProductModelLevel();
    Node rootUnbrandedProductNode =
        Node.builder()
            .concept(productQuantity.getProductDetails().getDeviceType())
            .displayName(rootUnbrandedProductLevel.getName())
            .modelLevel(rootUnbrandedProductLevel.getModelLevelType())
            .label(rootUnbrandedProductLevel.getDisplayLabel())
            .build();
    innerProductSummary.addNode(rootUnbrandedProductNode);

    ModelLevel leafUnbrandedProductModelLevel =
        modelConfiguration.getLeafUnbrandedProductModelLevel();
    Node leafUnbrandedProductNode;
    if (productQuantity.getProductDetails().getSpecificDeviceType() != null) {
      leafUnbrandedProductNode =
          Node.builder()
              .concept(productQuantity.getProductDetails().getSpecificDeviceType())
              .displayName(leafUnbrandedProductModelLevel.getName())
              .modelLevel(leafUnbrandedProductModelLevel.getModelLevelType())
              .label(leafUnbrandedProductModelLevel.getDisplayLabel())
              .build();
    } else {
      leafUnbrandedProductNode =
          Node.builder()
              .newConceptDetails(
                  getNewLeafUnbrandedDetails(
                      models.getModelConfiguration(branch),
                      leafUnbrandedProductModelLevel,
                      productQuantity.getProductDetails(),
                      cache.getNextId(),
                      rootUnbrandedProductNode))
              .displayName(leafUnbrandedProductModelLevel.getName())
              .modelLevel(leafUnbrandedProductModelLevel.getModelLevelType())
              .label(leafUnbrandedProductModelLevel.getDisplayLabel())
              .build();
    }
    innerProductSummary.addNode(leafUnbrandedProductNode);
    innerProductSummary.addEdge(
        leafUnbrandedProductNode.getConceptId(),
        rootUnbrandedProductNode.getConceptId(),
        ProductSummaryService.IS_A_LABEL);

    ModelLevel leafBrandedProductModelLevel = modelConfiguration.getLeafProductModelLevel();

    Node leafBrandedProductNode =
        nodeGeneratorService.generateNode(
            branch,
            cache,
            getLeafBrandedProductRelationships(
                leafUnbrandedProductNode, productQuantity.getProductDetails(), modelConfiguration),
            Set.of(leafBrandedProductModelLevel.getReferenceSetIdentifier()),
            leafBrandedProductModelLevel,
            leafBrandedProductModelLevel.getDeviceSemanticTag(),
            Set.of(),
            calculateNonDefiningRelationships(
                models.getModelConfiguration(branch),
                packageDetails,
                leafBrandedProductModelLevel.getModelLevelType()),
            packageDetails.getSelectedConceptIdentifiers(),
            false,
            false,
            true);
    if (leafBrandedProductNode.isNewConcept()) {
      leafBrandedProductNode
          .getNewConceptDetails()
          .setPreferredTerm(calculateBrandedProductName(productQuantity.getProductDetails()));
      leafBrandedProductNode
          .getNewConceptDetails()
          .setFullySpecifiedName(
              leafBrandedProductNode.getNewConceptDetails().getPreferredTerm()
                  + " ("
                  + leafBrandedProductModelLevel.getDeviceSemanticTag()
                  + ")");
    }

    innerProductSummary.addNode(leafBrandedProductNode);
    innerProductSummary.addEdge(
        leafBrandedProductNode.getConceptId(),
        leafUnbrandedProductNode.getConceptId(),
        ProductSummaryService.IS_A_LABEL);

    if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
      ModelLevel productNameLevel = modelConfiguration.getLevelOfType(ModelLevelType.PRODUCT_NAME);

      innerProductSummary.addNode(packageDetails.getProductName(), productNameLevel);
      innerProductSummary.addEdge(
          leafBrandedProductNode.getConceptId(),
          packageDetails.getProductName().getConceptId(),
          ProductSummaryService.HAS_PRODUCT_NAME_LABEL);
    } else if (modelConfiguration.getModelType().equals(ModelType.NMPC)) {
      ModelLevel rootBrandedProductLevel = modelConfiguration.getRootBrandedProductModelLevel();
      Node rootBrandedProductNode =
          nodeGeneratorService.generateNode(
              branch,
              cache,
              getAtmRelationships(
                  rootUnbrandedProductNode,
                  productQuantity.getProductDetails().getProductName(),
                  modelConfiguration.getModuleId()),
              Set.of(rootBrandedProductLevel.getReferenceSetIdentifier()),
              rootBrandedProductLevel,
              rootBrandedProductLevel.getDeviceSemanticTag(),
              Set.of(),
              calculateNonDefiningRelationships(
                  models.getModelConfiguration(branch),
                  packageDetails,
                  rootBrandedProductLevel.getModelLevelType()),
              packageDetails.getSelectedConceptIdentifiers(),
              false,
              false,
              true);
      if (rootBrandedProductNode.isNewConcept()) {
        rootBrandedProductNode
            .getNewConceptDetails()
            .setPreferredTerm(calculateAtmName(productQuantity.getProductDetails()));
        rootBrandedProductNode
            .getNewConceptDetails()
            .setFullySpecifiedName(
                rootBrandedProductNode.getNewConceptDetails().getPreferredTerm()
                    + " ("
                    + rootBrandedProductLevel.getDeviceSemanticTag()
                    + ")");
      }

      if (leafBrandedProductNode.isNewConcept()) {
        leafBrandedProductNode
            .getNewConceptDetails()
            .getAxioms()
            .iterator()
            .next()
            .addRelationshipsItem(
                getSnowstormRelationship(
                    IS_A, rootBrandedProductNode, 0, modelConfiguration.getModuleId()));
      }

      innerProductSummary.addNode(rootBrandedProductNode);
      innerProductSummary.addEdge(
          leafBrandedProductNode.getConceptId(),
          rootBrandedProductNode.getConceptId(),
          ProductSummaryService.IS_A_LABEL);
    }

    innerProductSummary.setSingleSubject(leafBrandedProductNode);
    return innerProductSummary;
  }

  private String calculateAtmName(DeviceProductDetails productDetails) {
    String deviceType = Objects.requireNonNull(productDetails.getDeviceType().getPt(), "Device type must have a preferred term").getTerm();
    String productName = Objects.requireNonNull(productDetails.getProductName().getPt(), "Product name must have a preferred term").getTerm();

    return productName + " " + deviceType;
  }

  private String calculateBrandedProductName(DeviceProductDetails productDetails) {
    String genericDeviceName =
        productDetails.getNewSpecificDeviceName() == null
            ? Objects.requireNonNull(productDetails.getSpecificDeviceType().getPt(), "Specific device type must have a preferred term").getTerm()
            : productDetails.getNewSpecificDeviceName();
    String deviceType = Objects.requireNonNull(productDetails.getDeviceType().getPt(), "Device type must have a preferred term").getTerm();
    String productName = Objects.requireNonNull(productDetails.getProductName().getPt(), "Product name must have a preferred term").getTerm();

    assert deviceType != null;
    assert genericDeviceName != null;
    return productName + " " + genericDeviceName.replace(deviceType, "");
  }

  private NewConceptDetails getNewLeafUnbrandedDetails(
      ModelConfiguration modelConfiguration,
      ModelLevel leafUnbrandedProductModelLevel,
      DeviceProductDetails productDetails,
      int id,
      Node rootUnbrandedNode) {
    NewConceptDetails leafUnbrandedDetails = new NewConceptDetails(id);
    leafUnbrandedDetails.setSemanticTag(leafUnbrandedProductModelLevel.getDeviceSemanticTag());
    String newSpecificDeviceName = productDetails.getNewSpecificDeviceName();
    leafUnbrandedDetails.setPreferredTerm(newSpecificDeviceName);
    leafUnbrandedDetails.setFullySpecifiedName(
        newSpecificDeviceName + " (" + leafUnbrandedProductModelLevel.getDeviceSemanticTag() + ")");
    SnowstormAxiom axiom = new SnowstormAxiom();
    axiom.active(true);
    axiom.setDefinitionStatusId(PRIMITIVE.getValue());
    axiom.setDefinitionStatus("PRIMITIVE");
    Set<SnowstormRelationship> relationships =
        getLeafUnbrandedRelationships(
            rootUnbrandedNode,
            productDetails.getOtherParentConcepts(),
            modelConfiguration.getModuleId());
    axiom.setRelationships(relationships);
    axiom.setModuleId(modelConfiguration.getModuleId());
    axiom.setReleased(false);
    leafUnbrandedDetails.getAxioms().add(axiom);
    leafUnbrandedDetails.setNonDefiningProperties(
        calculateNonDefiningRelationships(
            modelConfiguration,
            productDetails,
            leafUnbrandedProductModelLevel.getModelLevelType()));
    return leafUnbrandedDetails;
  }
}
