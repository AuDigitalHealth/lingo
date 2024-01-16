package com.csiro.snomio;

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
        .isEqualTo(packageDetails.getExternalIdentifiers());

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
    // subject is the root - no incoming edges
    Assertions.assertThat(
            productSummary.getEdges().stream()
                .filter(e -> e.getTarget().equals(productSummary.getSubject().getConceptId()))
                .collect(Collectors.toSet()))
        .isEmpty();

    // all nodes other than the subject have an incoming edge
    productSummary.getNodes().stream()
        .filter(n -> !n.getConceptId().equals(productSummary.getSubject().getConceptId()))
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
        productSummary.getNodes().stream().map(n -> n.getConceptId()).collect(Collectors.toSet());

    Set<String> sources =
        productSummary.getEdges().stream().map(e -> e.getSource()).collect(Collectors.toSet());

    Set<String> targets =
        productSummary.getEdges().stream().map(e -> e.getTarget()).collect(Collectors.toSet());

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

  public static void confirmAmtModelLinks(ProductSummary productSummary) {
    assertBasicProductSummaryReferentialIntegrity(productSummary);

    Set<Edge> expectedEdges = new HashSet<>();

    // establish the "root" pack concepts
    String rootCtppId = productSummary.getSubject().getConceptId();

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

    // if this is a multipack, establish the subpacks
    Set<String> subpackCtppIds =
        productSummary.getConceptIdsWithLabel(CTPP_LABEL).stream()
            .filter(id -> !id.equals(rootCtppId))
            .collect(Collectors.toSet());
    Set<String> subpackTppIds =
        productSummary.getConceptIdsWithLabel(TPP_LABEL).stream()
            .filter(id -> !id.equals(rootTppId))
            .collect(Collectors.toSet());
    Set<String> subpackMppIds =
        productSummary.getConceptIdsWithLabel(MPP_LABEL).stream()
            .filter(id -> !id.equals(rootMppId))
            .collect(Collectors.toSet());

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

    Assertions.assertThat(productSummary.getEdges())
        .containsAll(expectedEdges)
        .withFailMessage("Product summary did not contain all expected edges");
    Assertions.assertThat(expectedEdges)
        .containsAll(productSummary.getEdges())
        .withFailMessage("Product summary contained unexpected edges");
  }
}
