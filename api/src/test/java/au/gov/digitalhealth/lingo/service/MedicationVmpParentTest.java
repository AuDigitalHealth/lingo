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

import static au.gov.digitalhealth.lingo.util.NmpcConstants.VIRTUAL_MEDICINAL_PRODUCT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.IS_A;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.UNIT_OF_PRESENTATION;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleAxiom;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.toSnowstormConceptMini;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.gov.digitalhealth.lingo.configuration.Configuration;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.product.FsnAndPt;
import au.gov.digitalhealth.lingo.product.NameGeneratorSpec;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.ProductQuantity;
import au.gov.digitalhealth.lingo.service.namegenerator.NameGenerationClient;
import au.gov.digitalhealth.lingo.util.NmpcConstants;
import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.ExecutionException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;
import org.mockito.stubbing.Answer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.MockReset;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Mono;

/**
 * Verifies that {@link MedicationProductCalculationService} always states a newly created NMPC VMP
 * (Virtual Medicinal Product, CLINICAL_DRUG) as a subtype of {@code 660341000220102 | Virtual
 * medicinal product (product)}.
 *
 * <p>Regression guard for the defect where the VMP-root {@code IS A} was only added when the VMP
 * had no parent node. Because a VMP always gets its VTM (MEDICINAL_PRODUCT_ONLY) as a parent, the
 * VMP-root {@code IS A} was silently dropped and new VMPs were no longer subtypes of {@code
 * 660341000220102}. The VMP-root {@code IS A} must be additive to the VTM parent {@code IS A}, not
 * mutually exclusive with it.
 *
 * <p>Snowstorm and the name-generation client are mocked so this test runs against the AMT-only
 * Testcontainers dataset used by the rest of the suite. {@link Isolated} prevents concurrent
 * execution with other {@link SpringBootTest} classes that share the same mock beans (see {@link
 * MedicationBrandedProductNameTest} for the rationale).
 */
@SpringBootTest(
    classes = Configuration.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Isolated
class MedicationVmpParentTest {

  /**
   * NMPC branch config key (see {@link MedicationBrandedProductNameTest} for the encoding note).
   */
  private static final String NMPC_BRANCH = "MAIN_SNOMEDCT-IE";

  /**
   * Real NMPC SCTIDs (pass Verhoeff validation) used as stand-ins for the form and brand name. ECL
   * lookups against them return empty (Snowstorm is mocked), so both become new concepts.
   */
  private static final String GENERIC_FORM_ID = NmpcConstants.VIRTUAL_MEDICINAL_PRODUCT.getValue();

  private static final String PRODUCT_NAME_ID = NmpcConstants.PACKAGE_NMPC.getValue();

  @MockBean(reset = MockReset.NONE)
  SnowstormClient snowstormClient;

  @MockBean(reset = MockReset.NONE)
  NameGenerationClient nameGenerationClient;

  @Autowired MedicationProductCalculationService productCalculationService;

  @Autowired Models models;

  @BeforeEach
  void stubMocks() {
    // ECL lookups return nothing → every node becomes a new concept.
    when(snowstormClient.getConceptsFromEcl(anyString(), anyString(), anyInt(), anyBoolean()))
        .thenReturn(List.of());
    when(snowstormClient.getConceptsFromEcl(
            anyString(), anyString(), anyInt(), anyInt(), anyBoolean()))
        .thenReturn(List.of());
    when(snowstormClient.getConceptsFromEcl(
            anyString(), anyString(), anyInt(), anyInt(), anyBoolean(), any()))
        .thenReturn(List.of());

    // Concept-existence check (used by optionallyAddNmpcType): return empty → nmpcType skipped.
    when(snowstormClient.conceptIdsThatExist(anyString(), any())).thenReturn(List.<String>of());

    // Task / project change-tracking: no concepts changed.
    when(snowstormClient.getConceptIdsChangedOnTask(anyString()))
        .thenReturn(Mono.just(List.<String>of()));
    when(snowstormClient.getConceptIdsChangedOnProject(anyString()))
        .thenReturn(Mono.just(List.<String>of()));

    // Name generator: return a plausible stub FSN and PT.
    when(nameGenerationClient.generateNames(any(NameGeneratorSpec.class)))
        .thenAnswer(
            (Answer<FsnAndPt>)
                invocation -> {
                  NameGeneratorSpec spec = invocation.getArgument(0, NameGeneratorSpec.class);
                  return FsnAndPt.builder()
                      .FSN("Mock fully specified name (" + spec.getTag() + ")")
                      .PT("Mock preferred term")
                      .build();
                });
  }

  @Test
  void newVmpIsStatedAsSubtypeOfVirtualMedicinalProductRootForNmpc()
      throws ExecutionException, InterruptedException {
    ProductSummary summary =
        productCalculationService.calculateProductFromAtomicData(NMPC_BRANCH, nmpcPackage());

    SnowstormAxiom vmpAxiom = getSingleAxiom(newVmp(summary).getNewConceptDetails());

    assertThat(vmpAxiom.getRelationships())
        .as(
            "a new NMPC VMP must be stated as a subtype of %s | Virtual medicinal product (product)",
            VIRTUAL_MEDICINAL_PRODUCT.getValue())
        .anyMatch(
            r ->
                Boolean.TRUE.equals(r.getActive())
                    && IS_A.getValue().equals(r.getTypeId())
                    && VIRTUAL_MEDICINAL_PRODUCT.getValue().equals(r.getDestinationId()));
  }

  @Test
  void newVmpRetainsVtmParentInAdditionToTheRootForNmpc()
      throws ExecutionException, InterruptedException {
    ProductSummary summary =
        productCalculationService.calculateProductFromAtomicData(NMPC_BRANCH, nmpcPackage());

    Node vtm =
        summary.getNodes().stream()
            .filter(Node::isNewConcept)
            .filter(n -> n.getModelLevel().equals(ModelLevelType.MEDICINAL_PRODUCT_ONLY))
            .findFirst()
            .orElseThrow(
                () ->
                    new AssertionError(
                        "No new-concept node found at VTM (MEDICINAL_PRODUCT_ONLY) level; nodes"
                            + " were: "
                            + summary.getNodes()));

    SnowstormAxiom vmpAxiom = getSingleAxiom(newVmp(summary).getNewConceptDetails());

    // The VMP-root IS A is additive: the VMP must retain its IS A to the VTM parent as well.
    assertThat(vmpAxiom.getRelationships())
        .as("the new NMPC VMP must retain its IS A to the VTM parent %s", vtm.getConceptId())
        .anyMatch(
            r ->
                Boolean.TRUE.equals(r.getActive())
                    && IS_A.getValue().equals(r.getTypeId())
                    && vtm.getConceptId().equals(r.getDestinationId()));
    assertThat(vmpAxiom.getRelationships())
        .as("the new NMPC VMP must also carry the VMP-root IS A")
        .anyMatch(
            r ->
                Boolean.TRUE.equals(r.getActive())
                    && IS_A.getValue().equals(r.getTypeId())
                    && VIRTUAL_MEDICINAL_PRODUCT.getValue().equals(r.getDestinationId()));
  }

  private Node newVmp(ProductSummary summary) {
    return summary.getNodes().stream()
        .filter(Node::isNewConcept)
        .filter(n -> n.getModelLevel().equals(ModelLevelType.CLINICAL_DRUG))
        .findFirst()
        .orElseThrow(
            () ->
                new AssertionError(
                    "No new-concept node found at VMP (CLINICAL_DRUG) level; nodes were: "
                        + summary.getNodes()));
  }

  /**
   * Builds a minimal NMPC {@link PackageDetails} with a single contained product. Uses empty active
   * ingredients (NO_INGREDIENTS template) to avoid BoSS ECL calls.
   */
  private static PackageDetails<MedicationProductDetails> nmpcPackage() {
    MedicationProductDetails productDetails = new MedicationProductDetails();
    // genericForm is required by NmpcMedicationDetailsValidator.
    productDetails.setGenericForm(
        toSnowstormConceptMini(GENERIC_FORM_ID, "Virtual medicinal product (product)"));
    // productName (brand) is required by NmpcMedicationDetailsValidator.
    productDetails.setProductName(
        toSnowstormConceptMini(PRODUCT_NAME_ID, "Ongentys (product name)"));

    ProductQuantity<MedicationProductDetails> productQuantity = new ProductQuantity<>();
    productQuantity.setProductDetails(productDetails);
    // Unit of presentation with quantity 1 satisfies NMPC package quantity validation.
    productQuantity.setValue(BigDecimal.ONE);
    productQuantity.setUnit(
        toSnowstormConceptMini(
            UNIT_OF_PRESENTATION.getValue(), "Unit of presentation (unit of presentation)"));

    PackageDetails<MedicationProductDetails> packageDetails = new PackageDetails<>();
    packageDetails.getContainedProducts().add(productQuantity);
    return packageDetails;
  }
}
