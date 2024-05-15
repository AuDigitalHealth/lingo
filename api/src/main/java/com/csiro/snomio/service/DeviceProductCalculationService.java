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
import static com.csiro.snomio.util.AmtConstants.CONTAINS_DEVICE;
import static com.csiro.snomio.util.AmtConstants.COUNT_OF_DEVICE_TYPE;
import static com.csiro.snomio.util.AmtConstants.CTPP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.HAS_CONTAINER_TYPE;
import static com.csiro.snomio.util.AmtConstants.HAS_OTHER_IDENTIFYING_INFORMATION;
import static com.csiro.snomio.util.AmtConstants.MPP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.SCT_AU_MODULE;
import static com.csiro.snomio.util.AmtConstants.TPP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.TPUU_REFSET_ID;
import static com.csiro.snomio.util.RelationshipSorter.sortRelationships;
import static com.csiro.snomio.util.SnomedConstants.BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.BRANDED_PHYSICAL_OBJECT_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CONTAINERIZED_BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.HAS_PACK_SIZE_UNIT;
import static com.csiro.snomio.util.SnomedConstants.HAS_PACK_SIZE_VALUE;
import static com.csiro.snomio.util.SnomedConstants.HAS_PRODUCT_NAME;
import static com.csiro.snomio.util.SnomedConstants.IS_A;
import static com.csiro.snomio.util.SnomedConstants.PACKAGE;
import static com.csiro.snomio.util.SnomedConstants.PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.PHYSICAL_OBJECT_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.PRIMITIVE;
import static com.csiro.snomio.util.SnomedConstants.UNIT_OF_PRESENTATION;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSnowstormDatatypeComponent;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSnowstormRelationship;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormConcreteValue.DataTypeEnum;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import com.csiro.snomio.exception.ProductAtomicDataValidationProblem;
import com.csiro.snomio.product.Edge;
import com.csiro.snomio.product.NewConceptDetails;
import com.csiro.snomio.product.Node;
import com.csiro.snomio.product.ProductSummary;
import com.csiro.snomio.product.details.DeviceProductDetails;
import com.csiro.snomio.product.details.PackageDetails;
import com.csiro.snomio.product.details.ProductQuantity;
import com.csiro.snomio.util.AmtConstants;
import com.csiro.snomio.util.SnomedConstants;
import com.csiro.snomio.util.SnowstormDtoUtil;
import com.csiro.snomio.util.ValidationUtil;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@Log
public class DeviceProductCalculationService {

  SnowstormClient snowstormClient;
  NodeGeneratorService nodeGeneratorService;

  @Autowired
  public DeviceProductCalculationService(
      SnowstormClient snowstormClient, NodeGeneratorService nodeGeneratorService) {
    this.snowstormClient = snowstormClient;
    this.nodeGeneratorService = nodeGeneratorService;
  }

  private static Set<SnowstormRelationship> getTpuuRelationships(
      Node mpuu, DeviceProductDetails productDetails) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A, mpuu, 0));
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
    return relationships;
  }

  private static Set<SnowstormRelationship> getMpuuRelationships(
      Node mp, Set<SnowstormConceptMini> otherParentConcepts) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A, mp, 0));
    if (otherParentConcepts != null) {
      otherParentConcepts.forEach(
          otherParentConcept ->
              relationships.add(getSnowstormRelationship(IS_A, otherParentConcept, 0)));
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
            : " " + productQuantity.getUnit().getPt().getTerm());
  }

  public ProductSummary calculateProductFromAtomicData(
      String branch, @Valid PackageDetails<@Valid DeviceProductDetails> packageDetails) {

    AtomicCache cache =
        new AtomicCache(
            packageDetails.getIdFsnMap(), AmtConstants.values(), SnomedConstants.values());

    validateProductDetails(packageDetails);

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

    Node mpp =
        getPackageNode(
            branch,
            packageDetails,
            cache,
            innerProductSummaries,
            productSummary,
            MPP_LABEL,
            SnowstormDtoUtil.toSnowstormConceptMini(PACKAGE));
    if (mpp.isNewConcept()) {
      String mppPreferredTerm = calculateMppPreferredTerm(innerProductSummaries);
      mpp.getNewConceptDetails().setPreferredTerm(mppPreferredTerm);
      mpp.getNewConceptDetails()
          .setFullySpecifiedName(
              mppPreferredTerm + " (" + PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG.getValue() + ")");
    }

    Node tpp =
        getPackageNode(
            branch,
            packageDetails,
            cache,
            innerProductSummaries,
            productSummary,
            TPP_LABEL,
            SnowstormDtoUtil.toSnowstormConceptMini(mpp));
    if (tpp.isNewConcept()) {
      String tppPreferredTerm = calculateTppPreferredTerm(innerProductSummaries);
      tpp.getNewConceptDetails().setPreferredTerm(tppPreferredTerm);
      tpp.getNewConceptDetails()
          .setFullySpecifiedName(
              tppPreferredTerm
                  + " ("
                  + BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG.getValue()
                  + ")");
    }

    productSummary.addEdge(tpp.getConceptId(), mpp.getConceptId(), IS_A_LABEL);
    productSummary.addNode(packageDetails.getProductName(), TP_LABEL);
    productSummary.addEdge(
        tpp.getConceptId(), packageDetails.getProductName().getConceptId(), HAS_PRODUCT_NAME_LABEL);

    Node ctpp =
        getPackageNode(
            branch,
            packageDetails,
            cache,
            innerProductSummaries,
            productSummary,
            CTPP_LABEL,
            SnowstormDtoUtil.toSnowstormConceptMini(tpp));
    if (ctpp.isNewConcept()) {
      String ctppPreferredTerm =
          calculateCtppPreferredTerm(innerProductSummaries, packageDetails.getContainerType());
      ctpp.getNewConceptDetails().setPreferredTerm(ctppPreferredTerm);
      ctpp.getNewConceptDetails()
          .setFullySpecifiedName(
              ctppPreferredTerm
                  + " ("
                  + CONTAINERIZED_BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG.getValue()
                  + ")");
    }

    productSummary.addEdge(ctpp.getConceptId(), tpp.getConceptId(), IS_A_LABEL);
    productSummary.addEdge(
        ctpp.getConceptId(),
        packageDetails.getProductName().getConceptId(),
        HAS_PRODUCT_NAME_LABEL);

    productSummary.setSubject(ctpp);

    Set<Edge> transitiveContainsEdges =
        ProductSummaryService.getTransitiveEdges(productSummary, new HashSet<>());
    productSummary.getEdges().addAll(transitiveContainsEdges);

    productSummary.getNodes().stream()
        .filter(Node::isNewConcept)
        .forEach(n -> n.getNewConceptDetails().getAxioms().forEach(a -> sortRelationships(a)));

    return productSummary;
  }

  private String calculateMppPreferredTerm(
      Map<ProductQuantity<DeviceProductDetails>, ProductSummary> innerProductSummaries) {
    return innerProductSummaries.entrySet().stream()
        .map(entry -> generatePackTerm(entry, MPUU_LABEL))
        .collect(Collectors.joining(", "));
  }

  private String calculateTppPreferredTerm(
      Map<ProductQuantity<DeviceProductDetails>, ProductSummary> innerProductSummaries) {
    return innerProductSummaries.entrySet().stream()
        .map(entry -> generatePackTerm(entry, TPUU_LABEL))
        .collect(Collectors.joining(", "));
  }

  private String calculateCtppPreferredTerm(
      Map<ProductQuantity<DeviceProductDetails>, ProductSummary> innerProductSummaries,
      SnowstormConceptMini containerType) {
    return innerProductSummaries.entrySet().stream()
        .map(entry -> generatePackTerm(entry, TPUU_LABEL))
        .collect(Collectors.joining(", "))
        .concat(", " + containerType.getPt().getTerm());
  }

  private Node getPackageNode(
      String branch,
      PackageDetails<DeviceProductDetails> packageDetails,
      AtomicCache cache,
      Map<ProductQuantity<DeviceProductDetails>, ProductSummary> innerProductSummaries,
      ProductSummary productSummary,
      String label,
      SnowstormConceptMini parent) {
    String containedLabel;
    AmtConstants refset;
    SnomedConstants semanticTag;
    Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers;

    switch (label) {
      case MPP_LABEL -> {
        containedLabel = MPUU_LABEL;
        refset = MPP_REFSET_ID;
        semanticTag = PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG;
        referenceSetMembers = Set.of();
      }
      case TPP_LABEL -> {
        containedLabel = TPUU_LABEL;
        refset = TPP_REFSET_ID;
        semanticTag = BRANDED_PHYSICAL_OBJECT_SEMANTIC_TAG;
        referenceSetMembers = Set.of();
      }
      case CTPP_LABEL -> {
        containedLabel = TPUU_LABEL;
        refset = CTPP_REFSET_ID;
        semanticTag = CONTAINERIZED_BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG;
        referenceSetMembers =
            SnowstormDtoUtil.getExternalIdentifierReferenceSetEntries(packageDetails);
      }
      default -> throw new IllegalArgumentException("Invalid label: " + label);
    }

    Node node =
        nodeGeneratorService.generateNode(
            branch,
            cache,
            getPackageRelationships(
                packageDetails, innerProductSummaries, containedLabel, semanticTag, parent),
            Set.of(refset.getValue()),
            label,
            referenceSetMembers,
            semanticTag.getValue(),
            packageDetails.getSelectedConceptIdentifiers());
    productSummary.addNode(node);
    innerProductSummaries.forEach(
        (productQuantity, innerProductSummary) ->
            productSummary.addEdge(
                node.getConceptId(),
                innerProductSummary.getSingleConceptWithLabel(containedLabel).getConceptId(),
                CONTAINS_LABEL));
    return node;
  }

  private Set<SnowstormRelationship> getPackageRelationships(
      PackageDetails<DeviceProductDetails> packageDetails,
      Map<ProductQuantity<DeviceProductDetails>, ProductSummary> innerProductSummaries,
      String containedTypeLabel,
      SnomedConstants semanticTag,
      SnowstormConceptMini parent) {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(getSnowstormRelationship(IS_A, parent, 0));
    int group = 1;
    for (Entry<ProductQuantity<DeviceProductDetails>, ProductSummary> innerProductSummaryEntry :
        innerProductSummaries.entrySet()) {
      relationships.add(
          getSnowstormRelationship(
              CONTAINS_DEVICE,
              innerProductSummaryEntry.getValue().getSingleConceptWithLabel(containedTypeLabel),
              group));
      relationships.add(
          getSnowstormRelationship(
              HAS_PACK_SIZE_UNIT, innerProductSummaryEntry.getKey().getUnit(), group));
      relationships.add(
          getSnowstormDatatypeComponent(
              HAS_PACK_SIZE_VALUE,
              innerProductSummaryEntry.getKey().getValue().toString(),
              DataTypeEnum.DECIMAL,
              group));
      group++;
    }
    relationships.add(
        getSnowstormDatatypeComponent(
            COUNT_OF_DEVICE_TYPE,
            Integer.toString(innerProductSummaries.size()),
            DataTypeEnum.INTEGER,
            group++));

    if (!containedTypeLabel.equals(MPUU_LABEL)) {
      relationships.add(
          getSnowstormRelationship(HAS_PRODUCT_NAME, packageDetails.getProductName(), group++));
    }

    if (semanticTag.equals(CONTAINERIZED_BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG)) {
      relationships.add(
          getSnowstormRelationship(HAS_CONTAINER_TYPE, packageDetails.getContainerType(), group));
    }
    return relationships;
  }

  private ProductSummary createSummaryForContainedProduct(
      String branch,
      PackageDetails<DeviceProductDetails> packageDetails,
      ProductQuantity<DeviceProductDetails> productQuantity,
      AtomicCache cache) {
    ProductSummary innerProductSummary = new ProductSummary();
    Node mp =
        Node.builder()
            .concept(productQuantity.getProductDetails().getDeviceType())
            .label(MP_LABEL)
            .build();
    innerProductSummary.addNode(mp);

    // TODO check somehow to see if there is a concept already with the specified device name, it is
    // an error if there is

    Node mpuu;
    if (productQuantity.getProductDetails().getSpecificDeviceType() != null) {
      mpuu =
          Node.builder()
              .concept(productQuantity.getProductDetails().getSpecificDeviceType())
              .label(MPUU_LABEL)
              .build();
    } else {
      mpuu =
          Node.builder()
              .newConceptDetails(getNewMpuuDetails(productQuantity, cache.getNextId(), mp))
              .label(MPUU_LABEL)
              .build();
    }
    innerProductSummary.addNode(mpuu);
    innerProductSummary.addEdge(mpuu.getConceptId(), mp.getConceptId(), IS_A_LABEL);

    Node tpuu =
        nodeGeneratorService.generateNode(
            branch,
            cache,
            getTpuuRelationships(mpuu, productQuantity.getProductDetails()),
            Set.of(TPUU_REFSET_ID.getValue()),
            TPUU_LABEL,
            Set.of(),
            BRANDED_PHYSICAL_OBJECT_SEMANTIC_TAG.getValue(),
            packageDetails.getSelectedConceptIdentifiers());
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
    innerProductSummary.addEdge(tpuu.getConceptId(), mpuu.getConceptId(), IS_A_LABEL);

    innerProductSummary.addNode(packageDetails.getProductName(), TP_LABEL);
    innerProductSummary.addEdge(
        tpuu.getConceptId(),
        packageDetails.getProductName().getConceptId(),
        HAS_PRODUCT_NAME_LABEL);

    innerProductSummary.setSubject(tpuu);
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
      ProductQuantity<@Valid DeviceProductDetails> productQuantity, int id, Node mp) {
    NewConceptDetails mpuuDetails = new NewConceptDetails(id);
    mpuuDetails.setSemanticTag(PHYSICAL_OBJECT_SEMANTIC_TAG.getValue());
    String newSpecificDeviceName = productQuantity.getProductDetails().getNewSpecificDeviceName();
    mpuuDetails.setPreferredTerm(newSpecificDeviceName);
    mpuuDetails.setFullySpecifiedName(
        newSpecificDeviceName + " (" + PHYSICAL_OBJECT_SEMANTIC_TAG.getValue() + ")");
    SnowstormAxiom axiom = new SnowstormAxiom();
    axiom.active(true);
    axiom.setDefinitionStatusId(PRIMITIVE.getValue());
    axiom.setDefinitionStatus("PRIMITIVE");
    Set<SnowstormRelationship> relationships =
        getMpuuRelationships(mp, productQuantity.getProductDetails().getOtherParentConcepts());
    axiom.setRelationships(relationships);
    axiom.setModuleId(SCT_AU_MODULE.getValue());
    axiom.setReleased(false);
    mpuuDetails.getAxioms().add(axiom);
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
            productQuantity ->
                productQuantity.getProductDetails().getSpecificDeviceType() != null
                    && !(productQuantity.getProductDetails().getOtherParentConcepts() == null
                        || productQuantity
                            .getProductDetails()
                            .getOtherParentConcepts()
                            .isEmpty()))) {
      throw new ProductAtomicDataValidationProblem(
          "Specific device type and other parent concepts cannot both be populated");
    }

    // device packages must contain at least one device
    if (productDetails.getContainedProducts().isEmpty()) {
      throw new ProductAtomicDataValidationProblem(
          "Device packages must contain at least one device");
    }

    for (ProductQuantity<DeviceProductDetails> productQuantity :
        productDetails.getContainedProducts()) {
      // validate quantity is one if unit is each
      ValidationUtil.validateQuantityValueIsOneIfUnitIsEach(productQuantity);
      validateDeviceType(productQuantity.getProductDetails());
    }
  }

  private void validateDeviceType(DeviceProductDetails deviceProductDetails) {
    // validate device type is not null
    if (deviceProductDetails.getDeviceType() == null) {
      throw new ProductAtomicDataValidationProblem("Device type is required");
    }
  }
}
