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

import static au.gov.digitalhealth.lingo.util.SnomedConstants.DRUG_DEVICE_COMBINATION_PRODUCT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.IS_A;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.PACK;
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
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.product.FsnAndPt;
import au.gov.digitalhealth.lingo.product.NameGeneratorSpec;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.Ingredient;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.ProductQuantity;
import au.gov.digitalhealth.lingo.service.namegenerator.NameGenerationClient;
import au.gov.digitalhealth.lingo.util.AmtConstants;
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
 * Verifies that a newly created AMT drug-device combination product gets an {@code IS A}
 * relationship to {@code 411115002 | Drug-device combination product (product)|} on both the
 * unbranded MPUU (Generic Product / CLINICAL_DRUG) and branded TPUU (Branded Product /
 * REAL_CLINICAL_DRUG) nodes.
 *
 * <p>Regression guard: {@link MedicationProductDetails#hasDeviceType()} was already used to select
 * the drug-device semantic tag but was not wired into the {@code IS A} relationships built in
 * {@code createClinicalDrugRelationships}, so the attribute was silently missing from newly
 * authored MPUU/TPUU concepts.
 *
 * <p>AMT is used rather than NMPC because {@code NmpcMedicationDetailsValidator} rejects a device
 * type on a medication product outright ("Product cannot have a device type defined") - NMPC has no
 * drug-device combination concept. {@code AmtMedicationDetailsValidator} is the only medication
 * validator that supports {@code ProductType.DRUG_DEVICE}, so that is the only branch through which
 * this code path can be exercised end to end.
 *
 * <p>Snowstorm and the name-generation client are mocked so the test drives {@link
 * MedicationProductCalculationService} end to end without a real terminology server. {@link
 * Isolated} prevents concurrent execution with other {@link SpringBootTest} classes that share the
 * same mock beans.
 */
@SpringBootTest(
    classes = Configuration.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Isolated
class MedicationDrugDeviceCombinationTest {

  /**
   * AMT branch config key (see {@link
   * au.gov.digitalhealth.lingo.service.validators.AmtBrandedProductNameRejectionTest} for the
   * encoding note).
   */
  private static final String AMT_BRANCH = "MAIN_SNOMEDCT-AU";

  /**
   * Real AMT SCTID used as a stand-in for the dose form. ECL lookups against it return empty
   * (Snowstorm is mocked), so it becomes a new concept, matching the "newly authored" scenario this
   * fix targets. Only used for the plain-medication (no device) negative control, since AMT forbids
   * a form and a device type being populated together.
   */
  private static final String GENERIC_FORM_ID = AmtConstants.INERT_SUBSTANCE.getValue();

  /** Real AMT SCTID used as a stand-in for the brand (product) name. */
  private static final String PRODUCT_NAME_ID = AmtConstants.ARTGID_REFSET.getValue();

  /**
   * Arbitrary stand-in for the device component; distinct from the expected IS A target below.
   * Mirrors the stand-in concept used for {@code deviceType} in {@code
   * AmtBrandedProductNameRejectionTest}.
   */
  private static final String DEVICE_TYPE_ID = AmtConstants.HAS_DEVICE_TYPE.getValue();

  /** Real AMT SCTID used as a stand-in for the active ingredient substance. */
  private static final String ACTIVE_INGREDIENT_ID = AmtConstants.INERT_SUBSTANCE.getValue();

  private static final String DRUG_DEVICE_COMBINATION_PRODUCT_ID =
      DRUG_DEVICE_COMBINATION_PRODUCT.getValue();

  @MockBean(reset = MockReset.NONE)
  SnowstormClient snowstormClient;

  @MockBean(reset = MockReset.NONE)
  NameGenerationClient nameGenerationClient;

  @Autowired MedicationProductCalculationService productCalculationService;

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
  void newMpuuIsStatedAsDrugDeviceCombinationProductForAmt()
      throws ExecutionException, InterruptedException {
    ProductSummary summary =
        productCalculationService.calculateProductFromAtomicData(AMT_BRANCH, amtPackage(true));

    SnowstormAxiom mpuuAxiom = getSingleAxiom(newMpuu(summary).getNewConceptDetails());

    assertThat(mpuuAxiom.getRelationships())
        .as(
            "a newly authored MPUU with a device type must be stated as a subtype of %s"
                + " | Drug-device combination product (product)|",
            DRUG_DEVICE_COMBINATION_PRODUCT_ID)
        .anyMatch(
            r ->
                Boolean.TRUE.equals(r.getActive())
                    && IS_A.getValue().equals(r.getTypeId())
                    && DRUG_DEVICE_COMBINATION_PRODUCT_ID.equals(r.getDestinationId()));
  }

  @Test
  void newTpuuIsStatedAsDrugDeviceCombinationProductForAmt()
      throws ExecutionException, InterruptedException {
    ProductSummary summary =
        productCalculationService.calculateProductFromAtomicData(AMT_BRANCH, amtPackage(true));

    SnowstormAxiom tpuuAxiom = getSingleAxiom(newTpuu(summary).getNewConceptDetails());

    assertThat(tpuuAxiom.getRelationships())
        .as(
            "a newly authored TPUU with a device type must be stated as a subtype of %s"
                + " | Drug-device combination product (product)|",
            DRUG_DEVICE_COMBINATION_PRODUCT_ID)
        .anyMatch(
            r ->
                Boolean.TRUE.equals(r.getActive())
                    && IS_A.getValue().equals(r.getTypeId())
                    && DRUG_DEVICE_COMBINATION_PRODUCT_ID.equals(r.getDestinationId()));
  }

  @Test
  void plainMedicationMpuuIsNotStatedAsDrugDeviceCombinationProduct()
      throws ExecutionException, InterruptedException {
    ProductSummary summary =
        productCalculationService.calculateProductFromAtomicData(AMT_BRANCH, amtPackage(false));

    SnowstormAxiom mpuuAxiom = getSingleAxiom(newMpuu(summary).getNewConceptDetails());

    assertThat(mpuuAxiom.getRelationships())
        .as("a plain medication with no device type must not gain the drug-device combination IS A")
        .noneMatch(
            r ->
                IS_A.getValue().equals(r.getTypeId())
                    && DRUG_DEVICE_COMBINATION_PRODUCT_ID.equals(r.getDestinationId()));
  }

  private Node newMpuu(ProductSummary summary) {
    return summary.getNodes().stream()
        .filter(Node::isNewConcept)
        .filter(n -> n.getModelLevel().equals(ModelLevelType.CLINICAL_DRUG))
        .findFirst()
        .orElseThrow(
            () ->
                new AssertionError(
                    "No new-concept node found at MPUU (CLINICAL_DRUG) level; nodes were: "
                        + summary.getNodes()));
  }

  private Node newTpuu(ProductSummary summary) {
    return summary.getNodes().stream()
        .filter(Node::isNewConcept)
        .filter(n -> n.getModelLevel().equals(ModelLevelType.REAL_CLINICAL_DRUG))
        .findFirst()
        .orElseThrow(
            () ->
                new AssertionError(
                    "No new-concept node found at TPUU (REAL_CLINICAL_DRUG) level; nodes were: "
                        + summary.getNodes()));
  }

  /**
   * Builds a minimal AMT {@link PackageDetails} with a single contained product.
   *
   * <p>When {@code withDeviceType} is {@code true} the product has a device type and no generic
   * form, since {@code AmtMedicationDetailsValidator} rejects a form and a device type being
   * populated together. When {@code false} it is a plain medication with a generic form and no
   * device type, used as the negative control.
   *
   * <p>A single active ingredient with no strength is used (the {@code NO_STRENGTH} template),
   * since {@code AmtMedicationDetailsValidator} does not support the {@code NO_INGREDIENTS}
   * template that an empty ingredient list would otherwise resolve to.
   */
  private static PackageDetails<MedicationProductDetails> amtPackage(boolean withDeviceType) {
    MedicationProductDetails productDetails = new MedicationProductDetails();
    // productName (brand) is required by AmtMedicationDetailsValidator.
    productDetails.setProductName(
        toSnowstormConceptMini(PRODUCT_NAME_ID, "Ongentys (product name)"));

    if (withDeviceType) {
      productDetails.setDeviceType(
          toSnowstormConceptMini(DEVICE_TYPE_ID, "Device (physical object)"));
    } else {
      productDetails.setGenericForm(
          toSnowstormConceptMini(GENERIC_FORM_ID, "Inert substance (substance)"));
    }

    Ingredient ingredient = new Ingredient();
    ingredient.setActiveIngredient(
        toSnowstormConceptMini(ACTIVE_INGREDIENT_ID, "Inert substance (substance)"));
    productDetails.getActiveIngredients().add(ingredient);

    ProductQuantity<MedicationProductDetails> productQuantity = new ProductQuantity<>();
    productQuantity.setProductDetails(productDetails);
    // Unit of presentation with an integer quantity satisfies the AMT rule that a product with a
    // device type must have a whole-number quantity in unit of presentation.
    productQuantity.setValue(BigDecimal.ONE);
    productQuantity.setUnit(
        toSnowstormConceptMini(
            UNIT_OF_PRESENTATION.getValue(), "Unit of presentation (unit of presentation)"));

    PackageDetails<MedicationProductDetails> packageDetails = new PackageDetails<>();
    // productName and containerType are both mandatory at the package level for AMT.
    packageDetails.setProductName(
        toSnowstormConceptMini(PRODUCT_NAME_ID, "Ongentys (product name)"));
    packageDetails.setContainerType(
        toSnowstormConceptMini(PACK.getValue(), "Pack (physical object)"));
    packageDetails.getContainedProducts().add(productQuantity);
    return packageDetails;
  }
}
