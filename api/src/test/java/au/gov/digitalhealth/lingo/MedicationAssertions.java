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
package au.gov.digitalhealth.lingo;

import static au.gov.digitalhealth.lingo.service.ProductSummaryService.CONTAINS_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.CTPP_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.HAS_PRODUCT_NAME_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.IS_A_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.MPP_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.MPUU_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.MP_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.TPP_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.TPUU_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.TP_LABEL;
import static au.gov.digitalhealth.lingo.util.AmtConstants.ARTGID_REFSET;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.BRANDED_CLINICAL_DRUG_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.BRANDED_PHYSICAL_OBJECT_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.BRANDED_PRODUCT_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CLINICAL_DRUG_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CONTAINERIZED_BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CONTAINERIZED_BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CONTAINERIZED_BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MEDICINAL_PRODUCT_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.PHYSICAL_OBJECT_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.PRODUCT_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.PRODUCT_SEMANTIC_TAG;

import au.gov.digitalhealth.lingo.product.Edge;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import junit.framework.AssertionFailedError;
import lombok.extern.java.Log;
import org.assertj.core.api.Assertions;

@Log
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
                            : BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG.getValue())
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

  public static void checkNoExternalIdentifiersOnTpp(ProductSummary productSummary) {
    productSummary.getNodes().stream()
        .filter(Node::isNewConcept)
        .forEach(
            n -> {
              if (!n.getLabel().equals(CTPP_LABEL)
                  && n.getNewConceptDetails().getReferenceSetMembers() != null) {
                Assertions.assertThat(n.getNewConceptDetails().getReferenceSetMembers())
                    .filteredOn(r -> Objects.equals(r.getRefsetId(), ARTGID_REFSET.getValue()))
                    .isEmpty();
                log.info(
                    "No ARTGID for "
                        + n.getConceptId()
                        + " "
                        + n.getNewConceptDetails().getReferenceSetMembers());
              }
            });
  }

  public static void checkExternalIdentifiers(
      ProductSummary productSummary, PackageDetails<?> packageDetails) {
    // If the concept is new and not a CTPP it shouldn't have an ARTGID
    productSummary.getNodes().stream()
        .filter(Node::isNewConcept)
        .forEach(
            n -> {
              if (!n.getLabel().equals(CTPP_LABEL)
                  && n.getNewConceptDetails().getReferenceSetMembers() != null) {
                Assertions.assertThat(n.getNewConceptDetails().getReferenceSetMembers())
                    .filteredOn(r -> Objects.equals(r.getRefsetId(), ARTGID_REFSET.getValue()))
                    .isEmpty();
                log.info(
                    "No ARTGID for "
                        + n.getConceptId()
                        + " "
                        + n.getNewConceptDetails().getReferenceSetMembers());
              } else if (n.getNewConceptDetails().getReferenceSetMembers() != null
                  && packageDetails.getExternalIdentifiers() != null) {
                Set<String> identifiers =
                    n.getNewConceptDetails().getReferenceSetMembers().stream()
                        .filter(r -> Objects.equals(r.getRefsetId(), ARTGID_REFSET.getValue()))
                        .flatMap(
                            r -> Objects.requireNonNull(r.getAdditionalFields()).values().stream())
                        .collect(Collectors.toSet());

                Assertions.assertThat(identifiers)
                    .isEqualTo(
                        packageDetails.getExternalIdentifiers().stream()
                            .map(ExternalIdentifier::getIdentifierValue)
                            .collect(Collectors.toSet()));

                log.info(
                    "ARTGID for "
                        + n.getConceptId()
                        + " "
                        + identifiers
                        + " matches "
                        + packageDetails.getExternalIdentifiers().stream()
                            .map(ExternalIdentifier::getIdentifierValue)
                            .collect(Collectors.toSet()));
              }
            });
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
