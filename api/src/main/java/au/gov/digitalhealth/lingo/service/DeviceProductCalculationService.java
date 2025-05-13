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

import static au.gov.digitalhealth.lingo.util.AmtConstants.CONTAINS_DEVICE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.COUNT_OF_DEVICE_TYPE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_CONTAINER_TYPE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_OTHER_IDENTIFYING_INFORMATION;
import static au.gov.digitalhealth.lingo.util.AmtConstants.NO_OII_VALUE;
import static au.gov.digitalhealth.lingo.util.NonDefiningPropertiesConverter.calculateNonDefiningRelationships;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.BRANDED_PHYSICAL_OBJECT_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CONTAINERIZED_BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRODUCT_NAME;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.IS_A;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.PACKAGE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.PHYSICAL_OBJECT_SEMANTIC_TAG;
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

  private static Set<SnowstormRelationship> getTpuuRelationships(
      Node mpuu, DeviceProductDetails productDetails, String moduleId) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A, mpuu, 0, moduleId));
    relationships.add(
        getSnowstormRelationship(
            HAS_PRODUCT_NAME, productDetails.getProductName(), 0, STATED_RELATIONSHIP, moduleId));
    relationships.add(
        getSnowstormDatatypeComponent(
            HAS_OTHER_IDENTIFYING_INFORMATION,
            !StringUtils.hasLength(productDetails.getOtherIdentifyingInformation())
                ? NO_OII_VALUE.getValue()
                : productDetails.getOtherIdentifyingInformation(),
            DataTypeEnum.STRING,
            0,
            STATED_RELATIONSHIP,
            moduleId));
    return relationships;
  }

  private static Set<SnowstormRelationship> getMpuuRelationships(
      Node mp, Set<SnowstormConceptMini> otherParentConcepts, String moduleId) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A, mp, 0, moduleId));
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
      Entry<ProductQuantity<DeviceProductDetails>, ProductSummary> entry, String label) {
    ProductSummary productSummary = entry.getValue();
    ProductQuantity<DeviceProductDetails> productQuantity = entry.getKey();
    return productSummary
            .getNode(productSummary.getSingleConceptWithLabel(label).getConceptId())
            .getPreferredTerm()
        + ", "
        + productQuantity.getValue()
        + (productQuantity.getUnit().getConceptId().equals(UNIT_OF_PRESENTATION.getValue())
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

    for (ProductQuantity<DeviceProductDetails> productQuantity :
        packageDetails.getContainedProducts()) {
      ProductSummary innerProductSummary =
          createSummaryForContainedProduct(branch, packageDetails, productQuantity, cache);

      innerProductSummaries.put(productQuantity, innerProductSummary);
      productSummary.addSummary(innerProductSummary);
    }

    CompletableFuture<Node> mpp =
        getPackageNode(
            branch,
            packageDetails,
            cache,
            innerProductSummaries,
            productSummary,
            ProductSummaryService.MPP_LABEL);

    CompletableFuture<Node> tpp =
        getPackageNode(
            branch,
            packageDetails,
            cache,
            innerProductSummaries,
            productSummary,
            ProductSummaryService.TPP_LABEL);

    CompletableFuture<Node> ctpp =
        getPackageNode(
            branch,
            packageDetails,
            cache,
            innerProductSummaries,
            productSummary,
            ProductSummaryService.CTPP_LABEL);

    CompletableFuture.allOf(mpp, tpp, ctpp).join();

    Node mppNode = mpp.join();
    Node tppNode = tpp.join();
    Node ctppNode = ctpp.join();

    if (mppNode.isNewConcept()) {
      String mppPreferredTerm = calculateMppPreferredTerm(innerProductSummaries);
      mppNode.getNewConceptDetails().setPreferredTerm(mppPreferredTerm);
      mppNode
          .getNewConceptDetails()
          .setFullySpecifiedName(
              mppPreferredTerm + " (" + PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG.getValue() + ")");
    }

    if (tppNode.isNewConcept()) {
      String tppPreferredTerm = calculateTppPreferredTerm(innerProductSummaries);
      tppNode.getNewConceptDetails().setPreferredTerm(tppPreferredTerm);
      tppNode
          .getNewConceptDetails()
          .setFullySpecifiedName(
              tppPreferredTerm
                  + " ("
                  + BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG.getValue()
                  + ")");
      tppNode
          .getNewConceptDetails()
          .getAxioms()
          .forEach(
              axiom ->
                  axiom
                      .getRelationships()
                      .add(
                          getSnowstormRelationship(
                              IS_A, mppNode, 0, modelConfiguration.getModuleId())));
    }

    productSummary.addEdge(
        tppNode.getConceptId(), mppNode.getConceptId(), ProductSummaryService.IS_A_LABEL);

    if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
      ModelLevel tpLevel = modelConfiguration.getLevelOfType(ModelLevelType.PRODUCT_NAME);
      productSummary.addNode(packageDetails.getProductName(), tpLevel);
      productSummary.addEdge(
          tppNode.getConceptId(),
          packageDetails.getProductName().getConceptId(),
          ProductSummaryService.HAS_PRODUCT_NAME_LABEL);
    }

    if (ctppNode.isNewConcept()) {
      String ctppPreferredTerm =
          calculateCtppPreferredTerm(innerProductSummaries, packageDetails.getContainerType());
      ctppNode.getNewConceptDetails().setPreferredTerm(ctppPreferredTerm);
      ctppNode
          .getNewConceptDetails()
          .setFullySpecifiedName(
              ctppPreferredTerm
                  + " ("
                  + CONTAINERIZED_BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG.getValue()
                  + ")");

      ctppNode
          .getNewConceptDetails()
          .getAxioms()
          .forEach(
              axiom ->
                  axiom
                      .getRelationships()
                      .add(
                          getSnowstormRelationship(
                              IS_A, tppNode, 0, modelConfiguration.getModuleId())));
    }

    productSummary.addEdge(
        ctppNode.getConceptId(), tppNode.getConceptId(), ProductSummaryService.IS_A_LABEL);
    productSummary.addEdge(
        ctppNode.getConceptId(),
        packageDetails.getProductName().getConceptId(),
        ProductSummaryService.HAS_PRODUCT_NAME_LABEL);

    productSummary.setSingleSubject(ctppNode);

    Set<Edge> transitiveContainsEdges =
        ProductSummaryService.getTransitiveEdges(productSummary, new HashSet<>());
    productSummary.getEdges().addAll(transitiveContainsEdges);

    productSummary.updateNodeChangeStatus(
        taskChangedConceptIds.block(), projectChangedConceptIds.block());

    return productSummary;
  }

  private String calculateMppPreferredTerm(
      Map<ProductQuantity<DeviceProductDetails>, ProductSummary> innerProductSummaries) {
    return innerProductSummaries.entrySet().stream()
        .map(entry -> generatePackTerm(entry, ProductSummaryService.MPUU_LABEL))
        .collect(Collectors.joining(", "));
  }

  private String calculateTppPreferredTerm(
      Map<ProductQuantity<DeviceProductDetails>, ProductSummary> innerProductSummaries) {
    return innerProductSummaries.entrySet().stream()
        .map(entry -> generatePackTerm(entry, ProductSummaryService.TPUU_LABEL))
        .collect(Collectors.joining(", "));
  }

  private String calculateCtppPreferredTerm(
      Map<ProductQuantity<DeviceProductDetails>, ProductSummary> innerProductSummaries,
      SnowstormConceptMini containerType) {
    return innerProductSummaries.entrySet().stream()
        .map(entry -> generatePackTerm(entry, ProductSummaryService.TPUU_LABEL))
        .collect(Collectors.joining(", "))
        .concat(", " + containerType.getPt().getTerm());
  }

  private CompletableFuture<Node> getPackageNode(
      String branch,
      PackageDetails<DeviceProductDetails> packageDetails,
      AtomicCache cache,
      Map<ProductQuantity<DeviceProductDetails>, ProductSummary> innerProductSummaries,
      ProductSummary productSummary,
      String label) {
    String containedLabel;
    Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers;

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    ModelLevel modelLevel;

    switch (label) {
      case ProductSummaryService.MPP_LABEL -> {
        containedLabel = ProductSummaryService.MPUU_LABEL;
        modelLevel = modelConfiguration.getLevelOfType(ModelLevelType.PACKAGED_CLINICAL_DRUG);
        referenceSetMembers =
            SnowstormDtoUtil.getExternalIdentifierReferenceSetEntries(
                packageDetails.getExternalIdentifiers(),
                ModelLevelType.PACKAGED_CLINICAL_DRUG,
                models
                    .getModelConfiguration(branch)
                    .getMappingRefsetMapForType(
                        ProductPackageType.PACKAGE, ProductPackageType.CONTAINED_PACKAGE));
      }
      case ProductSummaryService.TPP_LABEL -> {
        containedLabel = ProductSummaryService.TPUU_LABEL;
        modelLevel = modelConfiguration.getLevelOfType(ModelLevelType.REAL_PACKAGED_CLINICAL_DRUG);
        referenceSetMembers =
            SnowstormDtoUtil.getExternalIdentifierReferenceSetEntries(
                packageDetails.getExternalIdentifiers(),
                ModelLevelType.REAL_PACKAGED_CLINICAL_DRUG,
                models
                    .getModelConfiguration(branch)
                    .getMappingRefsetMapForType(
                        ProductPackageType.PACKAGE, ProductPackageType.CONTAINED_PACKAGE));
      }
      case ProductSummaryService.CTPP_LABEL -> {
        containedLabel = ProductSummaryService.TPUU_LABEL;
        modelLevel =
            modelConfiguration.getLevelOfType(
                ModelLevelType.REAL_CONTAINERIZED_PACKAGED_CLINICAL_DRUG);
        referenceSetMembers =
            SnowstormDtoUtil.getExternalIdentifierReferenceSetEntries(
                packageDetails.getExternalIdentifiers(),
                ModelLevelType.REAL_CONTAINERIZED_PACKAGED_CLINICAL_DRUG,
                models
                    .getModelConfiguration(branch)
                    .getMappingRefsetMapForType(
                        ProductPackageType.PACKAGE, ProductPackageType.CONTAINED_PACKAGE));
      }
      default -> throw new IllegalArgumentException("Invalid label: " + label);
    }

    return nodeGeneratorService
        .generateNodeAsync(
            branch,
            cache,
            getPackageRelationships(
                packageDetails,
                innerProductSummaries,
                containedLabel,
                modelLevel.getDeviceSemanticTag(),
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
            label.equals(ProductSummaryService.MPP_LABEL),
            true)
        .thenApply(
            n -> {
              productSummary.addNode(n);
              innerProductSummaries.forEach(
                  (productQuantity, innerProductSummary) ->
                      productSummary.addEdge(
                          n.getConceptId(),
                          innerProductSummary
                              .getSingleConceptWithLabel(containedLabel)
                              .getConceptId(),
                          ProductSummaryService.CONTAINS_LABEL));
              return n;
            });
  }

  private Set<SnowstormRelationship> getPackageRelationships(
      PackageDetails<DeviceProductDetails> packageDetails,
      Map<ProductQuantity<DeviceProductDetails>, ProductSummary> innerProductSummaries,
      String containedTypeLabel,
      String semanticTag,
      ModelConfiguration modelConfiguration) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A, PACKAGE, 0, modelConfiguration.getModuleId()));
    int group = 1;
    for (Entry<ProductQuantity<DeviceProductDetails>, ProductSummary> innerProductSummaryEntry :
        innerProductSummaries.entrySet()) {
      relationships.add(
          getSnowstormRelationship(
              CONTAINS_DEVICE,
              innerProductSummaryEntry.getValue().getSingleConceptWithLabel(containedTypeLabel),
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
                  innerProductSummaryEntry.getKey().getValue(), decimalScale),
              DataTypeEnum.DECIMAL,
              group,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
      group++;
    }
    relationships.add(
        getSnowstormDatatypeComponent(
            COUNT_OF_DEVICE_TYPE,
            Integer.toString(innerProductSummaries.size()),
            DataTypeEnum.INTEGER,
            0,
            STATED_RELATIONSHIP,
            modelConfiguration.getModuleId()));

    if (!containedTypeLabel.equals(ProductSummaryService.MPUU_LABEL)) {
      relationships.add(
          getSnowstormRelationship(
              HAS_PRODUCT_NAME,
              packageDetails.getProductName(),
              group++,
              STATED_RELATIONSHIP,
              modelConfiguration.getModuleId()));
    }

    if (semanticTag.equals(CONTAINERIZED_BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG.getValue())) {
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
    ModelLevelType mpType;
    if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
      mpType = ModelLevelType.MEDICINAL_PRODUCT;
    } else {
      mpType = ModelLevelType.MEDICINAL_PRODUCT_ONLY;
    }

    ModelLevel mpLevel = modelConfiguration.getLevelOfType(mpType);
    Node mp =
        Node.builder()
            .concept(productQuantity.getProductDetails().getDeviceType())
            .displayName(mpLevel.getName())
            .modelLevel(mpLevel.getModelLevelType())
            .label(mpLevel.getDisplayLabel())
            .build();
    innerProductSummary.addNode(mp);

    ModelLevel mpuuLevel = modelConfiguration.getLevelOfType(ModelLevelType.CLINICAL_DRUG);
    Node mpuu;
    if (productQuantity.getProductDetails().getSpecificDeviceType() != null) {
      mpuu =
          Node.builder()
              .concept(productQuantity.getProductDetails().getSpecificDeviceType())
              .displayName(mpuuLevel.getName())
              .modelLevel(mpuuLevel.getModelLevelType())
              .label(mpuuLevel.getDisplayLabel())
              .build();
    } else {
      mpuu =
          Node.builder()
              .newConceptDetails(
                  getNewMpuuDetails(
                      models.getModelConfiguration(branch),
                      productQuantity.getProductDetails(),
                      cache.getNextId(),
                      mp))
              .displayName(mpuuLevel.getName())
              .modelLevel(mpuuLevel.getModelLevelType())
              .label(mpuuLevel.getDisplayLabel())
              .build();
    }
    innerProductSummary.addNode(mpuu);
    innerProductSummary.addEdge(
        mpuu.getConceptId(), mp.getConceptId(), ProductSummaryService.IS_A_LABEL);

    ModelLevel tpuuLevel = modelConfiguration.getLevelOfType(ModelLevelType.REAL_CLINICAL_DRUG);

    Node tpuu =
        nodeGeneratorService.generateNode(
            branch,
            cache,
            getTpuuRelationships(
                mpuu, productQuantity.getProductDetails(), modelConfiguration.getModuleId()),
            Set.of(tpuuLevel.getReferenceSetIdentifier()),
            tpuuLevel,
            tpuuLevel.getDeviceSemanticTag(),
            Set.of(),
            calculateNonDefiningRelationships(
                models.getModelConfiguration(branch),
                packageDetails,
                ModelLevelType.REAL_CLINICAL_DRUG),
            packageDetails.getSelectedConceptIdentifiers(),
            false,
            false,
            true);
    if (tpuu.isNewConcept()) {
      tpuu.getNewConceptDetails()
          .setPreferredTerm(calculateTpuuName(productQuantity.getProductDetails()));
      tpuu.getNewConceptDetails()
          .setFullySpecifiedName(
              tpuu.getNewConceptDetails().getPreferredTerm()
                  + " ("
                  + BRANDED_PHYSICAL_OBJECT_SEMANTIC_TAG.getValue()
                  + ")");
    }

    innerProductSummary.addNode(tpuu);
    innerProductSummary.addEdge(
        tpuu.getConceptId(), mpuu.getConceptId(), ProductSummaryService.IS_A_LABEL);

    if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
      ModelLevel tpLevel = modelConfiguration.getLevelOfType(ModelLevelType.PRODUCT_NAME);

      innerProductSummary.addNode(packageDetails.getProductName(), tpLevel);
      innerProductSummary.addEdge(
          tpuu.getConceptId(),
          packageDetails.getProductName().getConceptId(),
          ProductSummaryService.HAS_PRODUCT_NAME_LABEL);
    }

    innerProductSummary.setSingleSubject(tpuu);
    return innerProductSummary;
  }

  private String calculateTpuuName(DeviceProductDetails productDetails) {
    String genericDeviceName =
        productDetails.getNewSpecificDeviceName() == null
            ? productDetails.getSpecificDeviceType().getPt().getTerm()
            : productDetails.getNewSpecificDeviceName();
    String deviceType = productDetails.getDeviceType().getPt().getTerm();
    String productName = productDetails.getProductName().getPt().getTerm();

    return productName + " " + genericDeviceName.replace(deviceType, "");
  }

  private NewConceptDetails getNewMpuuDetails(
      ModelConfiguration modelConfiguration, DeviceProductDetails productDetails, int id, Node mp) {
    NewConceptDetails mpuuDetails = new NewConceptDetails(id);
    mpuuDetails.setSemanticTag(PHYSICAL_OBJECT_SEMANTIC_TAG.getValue());
    String newSpecificDeviceName = productDetails.getNewSpecificDeviceName();
    mpuuDetails.setPreferredTerm(newSpecificDeviceName);
    mpuuDetails.setFullySpecifiedName(
        newSpecificDeviceName + " (" + PHYSICAL_OBJECT_SEMANTIC_TAG.getValue() + ")");
    SnowstormAxiom axiom = new SnowstormAxiom();
    axiom.active(true);
    axiom.setDefinitionStatusId(PRIMITIVE.getValue());
    axiom.setDefinitionStatus("PRIMITIVE");
    Set<SnowstormRelationship> relationships =
        getMpuuRelationships(
            mp, productDetails.getOtherParentConcepts(), modelConfiguration.getModuleId());
    axiom.setRelationships(relationships);
    axiom.setModuleId(modelConfiguration.getModuleId());
    axiom.setReleased(false);
    mpuuDetails.getAxioms().add(axiom);
    mpuuDetails.setNonDefiningProperties(
        calculateNonDefiningRelationships(
            modelConfiguration, productDetails, ModelLevelType.CLINICAL_DRUG));
    return mpuuDetails;
  }
}
