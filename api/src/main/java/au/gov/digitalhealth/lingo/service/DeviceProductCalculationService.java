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
import static au.gov.digitalhealth.lingo.util.AmtConstants.CTPP_REFSET_ID;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_CONTAINER_TYPE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_OTHER_IDENTIFYING_INFORMATION;
import static au.gov.digitalhealth.lingo.util.AmtConstants.MPP_REFSET_ID;
import static au.gov.digitalhealth.lingo.util.AmtConstants.NO_OII_VALUE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.SCT_AU_MODULE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.TPP_REFSET_ID;
import static au.gov.digitalhealth.lingo.util.AmtConstants.TPUU_REFSET_ID;
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
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.Edge;
import au.gov.digitalhealth.lingo.product.NewConceptDetails;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.DeviceProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.util.AmtConstants;
import au.gov.digitalhealth.lingo.util.BigDecimalFormatter;
import au.gov.digitalhealth.lingo.util.SnomedConstants;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import au.gov.digitalhealth.lingo.util.ValidationUtil;
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
  SnowstormClient snowstormClient;
  NodeGeneratorService nodeGeneratorService;

  @Value("${snomio.decimal-scale}")
  int decimalScale;

  public DeviceProductCalculationService(
      SnowstormClient snowstormClient, NodeGeneratorService nodeGeneratorService, Models models) {
    this.snowstormClient = snowstormClient;
    this.nodeGeneratorService = nodeGeneratorService;
    this.models = models;
  }

  private static Set<SnowstormRelationship> getTpuuRelationships(
      Node mpuu, DeviceProductDetails productDetails) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A, mpuu, 0));
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
    return relationships;
  }

  private static Set<SnowstormRelationship> getMpuuRelationships(
      Node mp, Set<SnowstormConceptMini> otherParentConcepts) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A, mp, 0));
    if (otherParentConcepts != null) {
      otherParentConcepts.forEach(
          otherParentConcept ->
              relationships.add(
                  getSnowstormRelationship(IS_A, otherParentConcept, 0, STATED_RELATIONSHIP)));
    }
    return relationships;
  }

  private static String generatePackTerm(
      Entry<DeviceProductDetails, ProductSummary> entry, String label) {
    ProductSummary productSummary = entry.getValue();
    DeviceProductDetails productDetails = entry.getKey();
    return productSummary
            .getNode(productSummary.getSingleConceptWithLabel(label).getConceptId())
            .getPreferredTerm()
        + ", "
        + productDetails.getPackSize().getValue()
        + (productDetails
                .getPackSize()
                .getUnit()
                .getConceptId()
                .equals(UNIT_OF_PRESENTATION.getValue())
            ? ""
            : " "
                + Objects.requireNonNull(
                        productDetails.getPackSize().getUnit().getPt(),
                        "Unit must have a preferred term")
                    .getTerm());
  }

  public ProductSummary calculateProductFromAtomicData(
      String branch, @Valid PackageDetails<@Valid DeviceProductDetails> packageDetails) {

    Mono<List<String>> taskChangedConceptIds = snowstormClient.getConceptIdsChangedOnTask(branch);

    Mono<List<String>> projectChangedConceptIds =
        snowstormClient.getConceptIdsChangedOnProject(branch);

    AtomicCache cache =
        new AtomicCache(
            packageDetails.getIdFsnMap(), AmtConstants.values(), SnomedConstants.values());

    validateProductDetails(packageDetails);

    ProductSummary productSummary = new ProductSummary();

    Map<DeviceProductDetails, ProductSummary> innerProductSummaries = new HashMap<>();

    for (DeviceProductDetails productDetails : packageDetails.getContainedProducts()) {
      ProductSummary innerProductSummary =
          createSummaryForContainedProduct(branch, packageDetails, productDetails, cache);

      innerProductSummaries.put(productDetails, innerProductSummary);
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
              axiom -> axiom.getRelationships().add(getSnowstormRelationship(IS_A, mppNode, 0)));
    }

    productSummary.addEdge(
        tppNode.getConceptId(), mppNode.getConceptId(), ProductSummaryService.IS_A_LABEL);
    productSummary.addNode(packageDetails.getProductName(), ProductSummaryService.TP_LABEL);
    productSummary.addEdge(
        tppNode.getConceptId(),
        packageDetails.getProductName().getConceptId(),
        ProductSummaryService.HAS_PRODUCT_NAME_LABEL);

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
              axiom -> axiom.getRelationships().add(getSnowstormRelationship(IS_A, tppNode, 0)));
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
      Map<DeviceProductDetails, ProductSummary> innerProductSummaries) {
    return innerProductSummaries.entrySet().stream()
        .map(entry -> generatePackTerm(entry, ProductSummaryService.MPUU_LABEL))
        .collect(Collectors.joining(", "));
  }

  private String calculateTppPreferredTerm(
      Map<DeviceProductDetails, ProductSummary> innerProductSummaries) {
    return innerProductSummaries.entrySet().stream()
        .map(entry -> generatePackTerm(entry, ProductSummaryService.TPUU_LABEL))
        .collect(Collectors.joining(", "));
  }

  private String calculateCtppPreferredTerm(
      Map<DeviceProductDetails, ProductSummary> innerProductSummaries,
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
      Map<DeviceProductDetails, ProductSummary> innerProductSummaries,
      ProductSummary productSummary,
      String label) {
    String containedLabel;
    AmtConstants refset;
    SnomedConstants semanticTag;
    Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers;
    ModelLevelType modelLevelType;

    switch (label) {
      case ProductSummaryService.MPP_LABEL -> {
        containedLabel = ProductSummaryService.MPUU_LABEL;
        refset = MPP_REFSET_ID;
        semanticTag = PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG;
        modelLevelType = ModelLevelType.PACKAGED_CLINICAL_DRUG;
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
        refset = TPP_REFSET_ID;
        semanticTag = BRANDED_PHYSICAL_OBJECT_SEMANTIC_TAG;
        modelLevelType = ModelLevelType.REAL_PACKAGED_CLINICAL_DRUG;
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
        refset = CTPP_REFSET_ID;
        semanticTag = CONTAINERIZED_BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG;
        modelLevelType = ModelLevelType.REAL_CONTAINERIZED_PACKAGED_CLINICAL_DRUG;
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
                packageDetails, innerProductSummaries, containedLabel, semanticTag),
            Set.of(refset.getValue()),
            label,
            referenceSetMembers,
            calculateNonDefiningRelationships(
                models.getModelConfiguration(branch), packageDetails, modelLevelType),
            semanticTag.getValue(),
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
      Map<DeviceProductDetails, ProductSummary> innerProductSummaries,
      String containedTypeLabel,
      SnomedConstants semanticTag) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A, PACKAGE, 0));
    int group = 1;
    for (Entry<DeviceProductDetails, ProductSummary> innerProductSummaryEntry :
        innerProductSummaries.entrySet()) {
      relationships.add(
          getSnowstormRelationship(
              CONTAINS_DEVICE,
              innerProductSummaryEntry.getValue().getSingleConceptWithLabel(containedTypeLabel),
              group));
      relationships.add(
          getSnowstormRelationship(
              HAS_PACK_SIZE_UNIT,
              innerProductSummaryEntry.getKey().getPackSize().getUnit(),
              group,
              STATED_RELATIONSHIP));
      relationships.add(
          getSnowstormDatatypeComponent(
              HAS_PACK_SIZE_VALUE,
              BigDecimalFormatter.formatBigDecimal(
                  innerProductSummaryEntry.getKey().getPackSize().getValue(), decimalScale),
              DataTypeEnum.DECIMAL,
              group,
              STATED_RELATIONSHIP));
      group++;
    }
    relationships.add(
        getSnowstormDatatypeComponent(
            COUNT_OF_DEVICE_TYPE,
            Integer.toString(innerProductSummaries.size()),
            DataTypeEnum.INTEGER,
            0,
            STATED_RELATIONSHIP));

    if (!containedTypeLabel.equals(ProductSummaryService.MPUU_LABEL)) {
      relationships.add(
          getSnowstormRelationship(
              HAS_PRODUCT_NAME, packageDetails.getProductName(), group++, STATED_RELATIONSHIP));
    }

    if (semanticTag.equals(CONTAINERIZED_BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG)) {
      relationships.add(
          getSnowstormRelationship(
              HAS_CONTAINER_TYPE, packageDetails.getContainerType(), group, STATED_RELATIONSHIP));
    }
    return relationships;
  }

  private ProductSummary createSummaryForContainedProduct(
      String branch,
      PackageDetails<DeviceProductDetails> packageDetails,
      DeviceProductDetails productDetails,
      AtomicCache cache) {
    ProductSummary innerProductSummary = new ProductSummary();
    Node mp =
        Node.builder()
            .concept(productDetails.getDeviceType())
            .label(ProductSummaryService.MP_LABEL)
            .build();
    innerProductSummary.addNode(mp);

    Node mpuu;
    if (productDetails.getSpecificDeviceType() != null) {
      mpuu =
          Node.builder()
              .concept(productDetails.getSpecificDeviceType())
              .label(ProductSummaryService.MPUU_LABEL)
              .build();
    } else {
      mpuu =
          Node.builder()
              .newConceptDetails(
                  getNewMpuuDetails(
                      models.getModelConfiguration(branch), productDetails, cache.getNextId(), mp))
              .label(ProductSummaryService.MPUU_LABEL)
              .build();
    }
    innerProductSummary.addNode(mpuu);
    innerProductSummary.addEdge(
        mpuu.getConceptId(), mp.getConceptId(), ProductSummaryService.IS_A_LABEL);

    Node tpuu =
        nodeGeneratorService.generateNode(
            branch,
            cache,
            getTpuuRelationships(mpuu, productDetails),
            Set.of(TPUU_REFSET_ID.getValue()),
            ProductSummaryService.TPUU_LABEL,
            Set.of(),
            calculateNonDefiningRelationships(
                models.getModelConfiguration(branch),
                packageDetails,
                ModelLevelType.REAL_CLINICAL_DRUG),
            BRANDED_PHYSICAL_OBJECT_SEMANTIC_TAG.getValue(),
            packageDetails.getSelectedConceptIdentifiers(),
            false,
            false,
            true);
    if (tpuu.isNewConcept()) {
      tpuu.getNewConceptDetails().setPreferredTerm(calculateTpuuName(productDetails));
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

    innerProductSummary.addNode(packageDetails.getProductName(), ProductSummaryService.TP_LABEL);
    innerProductSummary.addEdge(
        tpuu.getConceptId(),
        packageDetails.getProductName().getConceptId(),
        ProductSummaryService.HAS_PRODUCT_NAME_LABEL);

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
        getMpuuRelationships(mp, productDetails.getOtherParentConcepts());
    axiom.setRelationships(relationships);
    axiom.setModuleId(SCT_AU_MODULE.getValue());
    axiom.setReleased(false);
    mpuuDetails.getAxioms().add(axiom);
    mpuuDetails.setNonDefiningProperties(
        calculateNonDefiningRelationships(
            modelConfiguration, productDetails, ModelLevelType.CLINICAL_DRUG));
    return mpuuDetails;
  }

  private void validateProductDetails(PackageDetails<DeviceProductDetails> productDetails) {
    // device packages should not contain other packages
    if (!productDetails.getContainedPackages().isEmpty()) {
      throw new ProductAtomicDataValidationProblem("Device packages cannot contain other packages");
    }

    // if specific device type is not null, other parent concepts must be null or empty
    if (productDetails.getContainedProducts().stream()
        .anyMatch(
            deviceProductDetails ->
                deviceProductDetails.getSpecificDeviceType() != null
                    && !(deviceProductDetails.getOtherParentConcepts() == null
                        || deviceProductDetails.getOtherParentConcepts().isEmpty()))) {
      throw new ProductAtomicDataValidationProblem(
          "Specific device type and other parent concepts cannot both be populated");
    }

    // device packages must contain at least one device
    if (productDetails.getContainedProducts().isEmpty()) {
      throw new ProductAtomicDataValidationProblem(
          "Device packages must contain at least one device");
    }

    for (DeviceProductDetails deviceProductDetails : productDetails.getContainedProducts()) {
      // validate quantity is one if unit is each
      ValidationUtil.validateQuantityValueIsOneIfUnitIsEach(deviceProductDetails.getPackSize());
      validateDeviceType(deviceProductDetails);
    }
  }

  private void validateDeviceType(DeviceProductDetails deviceProductDetails) {
    // validate device type is not null
    if (deviceProductDetails.getDeviceType() == null) {
      throw new ProductAtomicDataValidationProblem("Device type is required");
    }
  }
}
