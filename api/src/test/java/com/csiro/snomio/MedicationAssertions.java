package com.csiro.snomio;

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
import static com.csiro.snomio.util.SnomedConstants.BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.BRANDED_CLINICAL_DRUG_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.BRANDED_PHYSICAL_OBJECT_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.BRANDED_PRODUCT_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CLINICAL_DRUG_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CONTAINERIZED_BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CONTAINERIZED_BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CONTAINERIZED_BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.MEDICINAL_PRODUCT_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.PHYSICAL_OBJECT_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.PRODUCT_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.PRODUCT_SEMANTIC_TAG;

import com.csiro.snomio.product.Edge;
import com.csiro.snomio.product.Node;
import com.csiro.snomio.product.ProductSummary;
import com.csiro.snomio.product.details.MedicationProductDetails;
import com.csiro.snomio.product.details.PackageDetails;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import junit.framework.AssertionFailedError;
import org.assertj.core.api.Assertions;

public class MedicationAssertions {

  public static void assertProductSummaryHas(
      ProductSummary productSummary, int numberOfNew, int numberOfExisting, String label) {
    Set<Node> nodeSet =
        productSummary.getNodes().stream()
            .filter(n -> n.getLabel().equals(label))
            .collect(Collectors.toSet());

    long countNew = nodeSet.stream().filter(Node::isNewConcept).count();
    if (countNew != numberOfNew) {
      throw new AssertionFailedError(
          "Product summary had "
              + countNew
              + " new nodes rather than expected "
              + numberOfNew
              + " of type "
              + label);
    }

    long countExisting = nodeSet.stream().filter(n -> !n.isNewConcept()).count();
    if (countExisting != numberOfExisting) {
      throw new AssertionFailedError(
          "Product summary had "
              + countExisting
              + " existing nodes rather than expected "
              + numberOfExisting
              + " of type "
              + label);
    }
  }

  public static void assertEqualPackage(
      PackageDetails<MedicationProductDetails> packageDetailsPostCreation,
      PackageDetails<MedicationProductDetails> packageDetails) {
    Assertions.assertThat(packageDetailsPostCreation.getProductName())
        .isEqualTo(packageDetails.getProductName());
    Assertions.assertThat(packageDetailsPostCreation.getContainerType())
        .isEqualTo(packageDetails.getContainerType());
    Assertions.assertThat(packageDetailsPostCreation.getExternalIdentifiers())
        .containsAll(packageDetails.getExternalIdentifiers());
    Assertions.assertThat(packageDetails.getExternalIdentifiers())
        .containsAll(packageDetailsPostCreation.getExternalIdentifiers());

    Assertions.assertThat(packageDetailsPostCreation.getContainedProducts())
        .containsAll(packageDetails.getContainedProducts());
    Assertions.assertThat(packageDetails.getContainedProducts())
        .containsAll(packageDetailsPostCreation.getContainedProducts());

    Assertions.assertThat(packageDetailsPostCreation.getContainedPackages())
        .containsAll(packageDetails.getContainedPackages());
    Assertions.assertThat(packageDetails.getContainedPackages())
        .containsAll(packageDetailsPostCreation.getContainedPackages());
  }

  public static void assertBasicProductSummaryReferentialIntegrity(ProductSummary productSummary) {
    Set<String> subjectIds =
        productSummary.getSubjects().stream().map(Node::getConceptId).collect(Collectors.toSet());

    // subject/s are roots - no incoming edges
    Assertions.assertThat(
            productSummary.getEdges().stream()
                .filter(e -> subjectIds.contains(e.getTarget()))
                .collect(Collectors.toSet()))
        .isEmpty();

    // all nodes other than the subject have an incoming edge
    productSummary.getNodes().stream()
        .filter(n -> !subjectIds.contains(n.getConceptId()))
        .forEach(
            n -> {
              Assertions.assertThat(
                      productSummary.getEdges().stream()
                          .filter(e -> e.getTarget().equals(n.getConceptId()))
                          .collect(Collectors.toSet()))
                  .withFailMessage("No incoming edge for " + n.getConceptId())
                  .isNotEmpty();
            });

    // edges have a source and target that are nodes
    Set<String> nodeIds =
        productSummary.getNodes().stream().map(Node::getConceptId).collect(Collectors.toSet());

    Set<String> sources =
        productSummary.getEdges().stream().map(Edge::getSource).collect(Collectors.toSet());

    Set<String> targets =
        productSummary.getEdges().stream().map(Edge::getTarget).collect(Collectors.toSet());

    Assertions.assertThat(nodeIds).containsAll(sources);
    Assertions.assertThat(nodeIds).containsAll(targets);
  }

  public static Set<Edge> addExpectedEdgesForUnits(
      ProductSummary productSummary,
      String ctppId,
      String tppId,
      String mppId,
      String outerCtppId,
      String outerTppId,
      String outerMppId) {

    boolean subpack = false;
    if (outerCtppId != null) {
      subpack = true;
      Assertions.assertThat(outerTppId).isNotNull();
      Assertions.assertThat(outerMppId).isNotNull();
    }

    Set<Edge> expectedEdgesForUnits = new HashSet<>();

    Set<String> rootTpuuIds =
        productSummary.getTargetsOfTypeWithLabel(ctppId, TPUU_LABEL, CONTAINS_LABEL);

    Assertions.assertThat(rootTpuuIds).withFailMessage("No TPUU found for " + ctppId).isNotEmpty();

    for (String tpuuId : rootTpuuIds) {
      expectedEdgesForUnits.add(new Edge(ctppId, tpuuId, CONTAINS_LABEL));
      expectedEdgesForUnits.add(new Edge(tppId, tpuuId, CONTAINS_LABEL));
      if (subpack) {
        expectedEdgesForUnits.add(new Edge(outerCtppId, tpuuId, CONTAINS_LABEL));
        expectedEdgesForUnits.add(new Edge(outerTppId, tpuuId, CONTAINS_LABEL));
      }

      String mpuuId = productSummary.getSingleTargetOfTypeWithLabel(tpuuId, MPUU_LABEL, IS_A_LABEL);
      expectedEdgesForUnits.add(new Edge(tpuuId, mpuuId, IS_A_LABEL));

      expectedEdgesForUnits.add(new Edge(ctppId, mpuuId, CONTAINS_LABEL));
      expectedEdgesForUnits.add(new Edge(tppId, mpuuId, CONTAINS_LABEL));
      expectedEdgesForUnits.add(new Edge(mppId, mpuuId, CONTAINS_LABEL));
      if (subpack) {
        expectedEdgesForUnits.add(new Edge(outerCtppId, mpuuId, CONTAINS_LABEL));
        expectedEdgesForUnits.add(new Edge(outerTppId, mpuuId, CONTAINS_LABEL));
        expectedEdgesForUnits.add(new Edge(outerMppId, mpuuId, CONTAINS_LABEL));
      }

      String mpId = productSummary.getSingleTargetOfTypeWithLabel(mpuuId, MP_LABEL, IS_A_LABEL);

      expectedEdgesForUnits.add(new Edge(mpuuId, mpId, IS_A_LABEL));
      expectedEdgesForUnits.add(new Edge(tpuuId, mpId, IS_A_LABEL));

      expectedEdgesForUnits.add(new Edge(ctppId, mpId, CONTAINS_LABEL));
      expectedEdgesForUnits.add(new Edge(tppId, mpId, CONTAINS_LABEL));
      expectedEdgesForUnits.add(new Edge(mppId, mpId, CONTAINS_LABEL));
      if (subpack) {
        expectedEdgesForUnits.add(new Edge(outerCtppId, mpId, CONTAINS_LABEL));
        expectedEdgesForUnits.add(new Edge(outerTppId, mpId, CONTAINS_LABEL));
        expectedEdgesForUnits.add(new Edge(outerMppId, mpId, CONTAINS_LABEL));
      }

      String tpId =
          productSummary.getSingleTargetOfTypeWithLabel(tpuuId, TP_LABEL, HAS_PRODUCT_NAME_LABEL);

      expectedEdgesForUnits.add(new Edge(tpuuId, tpId, HAS_PRODUCT_NAME_LABEL));
    }

    return expectedEdgesForUnits;
  }

  public static void assertSemanticTags(
      ProductSummary productSummary, boolean device, boolean medicated) {
    for (Node node : productSummary.getNodes().stream().filter(Node::isNewConcept).toList()) {
      switch (node.getLabel()) {
        case CTPP_LABEL ->
            Assertions.assertThat(node.getNewConceptDetails().getSemanticTag())
                .isEqualTo(
                    device
                        ? (medicated
                            ? CONTAINERIZED_BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG.getValue()
                            : CONTAINERIZED_BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG.getValue())
                        : CONTAINERIZED_BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG.getValue());
        case TPP_LABEL ->
            Assertions.assertThat(node.getNewConceptDetails().getSemanticTag())
                .isEqualTo(
                    device
                        ? (medicated
                            ? BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG.getValue()
                            : BRANDED_PHYSICAL_OBJECT_SEMANTIC_TAG.getValue())
                        : BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG.getValue());
        case MPP_LABEL ->
            Assertions.assertThat(node.getNewConceptDetails().getSemanticTag())
                .isEqualTo(
                    device
                        ? (medicated
                            ? PRODUCT_PACKAGE_SEMANTIC_TAG.getValue()
                            : PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG.getValue())
                        : CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG.getValue());
        case TPUU_LABEL ->
            Assertions.assertThat(node.getNewConceptDetails().getSemanticTag())
                .isEqualTo(
                    device
                        ? (medicated
                            ? BRANDED_PRODUCT_SEMANTIC_TAG.getValue()
                            : BRANDED_PHYSICAL_OBJECT_SEMANTIC_TAG.getValue())
                        : BRANDED_CLINICAL_DRUG_SEMANTIC_TAG.getValue());
        case MPUU_LABEL ->
            Assertions.assertThat(node.getNewConceptDetails().getSemanticTag())
                .isEqualTo(
                    device
                        ? (medicated
                            ? PRODUCT_SEMANTIC_TAG.getValue()
                            : PHYSICAL_OBJECT_SEMANTIC_TAG.getValue())
                        : CLINICAL_DRUG_SEMANTIC_TAG.getValue());
        case MP_LABEL ->
            Assertions.assertThat(node.getNewConceptDetails().getSemanticTag())
                .isEqualTo(
                    device
                        ? (medicated
                            ? MEDICINAL_PRODUCT_SEMANTIC_TAG.getValue()
                            : PHYSICAL_OBJECT_SEMANTIC_TAG.getValue())
                        : MEDICINAL_PRODUCT_SEMANTIC_TAG.getValue());
        default -> Assertions.fail("Unexpected node label: " + node.getLabel());
      }
    }
  }

  public static void confirmAmtModelLinks(
      ProductSummary productSummary, boolean isMultiProduct, boolean isDevice, boolean medicated) {
    assertSemanticTags(productSummary, isDevice, medicated);
    assertBasicProductSummaryReferentialIntegrity(productSummary);

    Set<Edge> expectedEdges = new HashSet<>();

    // establish the "root" pack concepts
    productSummary
        .getSubjects()
        .forEach(
            s ->
                confirmRootConnections(
                    productSummary, expectedEdges, s.getConceptId(), isMultiProduct));

    Set<Edge> missingEdges = new HashSet<>(expectedEdges);
    missingEdges.removeAll(productSummary.getEdges());

    Assertions.assertThat(productSummary.getEdges())
        .withFailMessage(
            "Product summary did not contain all expected edges, missing: " + missingEdges)
        .containsAll(expectedEdges);

    missingEdges.removeAll(expectedEdges);

    Assertions.assertThat(expectedEdges)
        .withFailMessage("Product summary contained unexpected edges " + expectedEdges)
        .containsAll(productSummary.getEdges());
  }

  private static void confirmRootConnections(
      ProductSummary productSummary,
      Set<Edge> expectedEdges,
      String rootCtppId,
      boolean isMultiProduct) {

    String rootTppId =
        productSummary.getSingleTargetOfTypeWithLabel(rootCtppId, TPP_LABEL, IS_A_LABEL);

    String rootMppId =
        productSummary.getSingleTargetOfTypeWithLabel(rootTppId, MPP_LABEL, IS_A_LABEL);

    expectedEdges.add(new Edge(rootCtppId, rootTppId, IS_A_LABEL));
    expectedEdges.add(new Edge(rootTppId, rootMppId, IS_A_LABEL));
    expectedEdges.add(new Edge(rootCtppId, rootMppId, IS_A_LABEL));

    String rootTpId =
        productSummary.getSingleTargetOfTypeWithLabel(rootCtppId, TP_LABEL, HAS_PRODUCT_NAME_LABEL);

    expectedEdges.add(new Edge(rootCtppId, rootTpId, HAS_PRODUCT_NAME_LABEL));
    expectedEdges.add(new Edge(rootTppId, rootTpId, HAS_PRODUCT_NAME_LABEL));

    Set<String> subpackCtppIds = Set.of();
    Set<String> subpackTppIds = Set.of();
    Set<String> subpackMppIds = Set.of();
    if (!isMultiProduct) {
      // if this is a multipack, establish the subpacks
      subpackCtppIds =
          productSummary.getConceptIdsWithLabel(CTPP_LABEL).stream()
              .filter(id -> !id.equals(rootCtppId))
              .collect(Collectors.toSet());
      subpackTppIds =
          productSummary.getConceptIdsWithLabel(TPP_LABEL).stream()
              .filter(id -> !id.equals(rootTppId))
              .collect(Collectors.toSet());
      subpackMppIds =
          productSummary.getConceptIdsWithLabel(MPP_LABEL).stream()
              .filter(id -> !id.equals(rootMppId))
              .collect(Collectors.toSet());
    }

    if (subpackCtppIds.isEmpty()) {
      Assertions.assertThat(subpackTppIds).isEmpty();
      Assertions.assertThat(subpackMppIds).isEmpty();

      // TPUU/MPUU from the root packs
      expectedEdges.addAll(
          addExpectedEdgesForUnits(
              productSummary, rootCtppId, rootTppId, rootMppId, null, null, null));
    } else {
      Assertions.assertThat(subpackTppIds).size().isEqualTo(subpackCtppIds.size());
      Assertions.assertThat(subpackMppIds).size().isEqualTo(subpackCtppIds.size());

      // TPUU/MPUU links from the subpacks only
      for (String subpackCtppId : subpackCtppIds) {
        String subpackTppId =
            productSummary.getSingleTargetOfTypeWithLabel(subpackCtppId, TPP_LABEL, IS_A_LABEL);

        String subpackMppId =
            productSummary.getSingleTargetOfTypeWithLabel(subpackTppId, MPP_LABEL, IS_A_LABEL);

        expectedEdges.add(new Edge(rootCtppId, subpackCtppId, CONTAINS_LABEL));
        expectedEdges.add(new Edge(rootCtppId, subpackTppId, CONTAINS_LABEL));
        expectedEdges.add(new Edge(rootCtppId, subpackMppId, CONTAINS_LABEL));
        expectedEdges.add(new Edge(rootTppId, subpackTppId, CONTAINS_LABEL));
        expectedEdges.add(new Edge(rootTppId, subpackMppId, CONTAINS_LABEL));
        expectedEdges.add(new Edge(rootMppId, subpackMppId, CONTAINS_LABEL));

        expectedEdges.add(new Edge(subpackCtppId, subpackTppId, IS_A_LABEL));
        expectedEdges.add(new Edge(subpackTppId, subpackMppId, IS_A_LABEL));
        expectedEdges.add(new Edge(subpackCtppId, subpackMppId, IS_A_LABEL));

        String subpackTpId =
            productSummary.getSingleTargetOfTypeWithLabel(
                subpackCtppId, TP_LABEL, HAS_PRODUCT_NAME_LABEL);

        expectedEdges.add(new Edge(subpackCtppId, subpackTpId, HAS_PRODUCT_NAME_LABEL));
        expectedEdges.add(new Edge(subpackTppId, subpackTpId, HAS_PRODUCT_NAME_LABEL));

        expectedEdges.addAll(
            addExpectedEdgesForUnits(
                productSummary,
                subpackCtppId,
                subpackTppId,
                subpackMppId,
                rootCtppId,
                rootTppId,
                rootMppId));
      }
    }
  }
}
