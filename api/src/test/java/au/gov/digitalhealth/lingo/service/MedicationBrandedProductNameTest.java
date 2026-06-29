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

import static au.gov.digitalhealth.lingo.util.SnomedConstants.UNIT_OF_PRESENTATION;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.toSnowstormConceptMini;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

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
 * Verifies that {@link MedicationProductCalculationService} transfers the user-supplied {@code
 * brandedProductName} from the product details onto the new-concept details of both the VMP
 * (unbranded Virtual Medicinal Product, CLINICAL_DRUG) and the branded leaf product (TPUU /
 * REAL_CLINICAL_DRUG) for NMPC calculations.
 *
 * <p>Snowstorm is mocked so this test does not require a running Snowstorm instance and works with
 * the AMT-only Testcontainers dataset used by the rest of the test suite. The name-generation
 * client is also mocked; the assertion targets only the field transfer, not generated descriptions.
 *
 * <p>{@link Isolated} prevents this class from running concurrently with other {@link
 * SpringBootTest} classes that share the same Spring application context and mock beans (e.g.
 * {@link DeviceBrandedProductNameTest}). Concurrent {@code @BeforeEach} stub registration on a
 * shared Mockito mock can produce {@code WrongTypeOfReturnValue} errors when the JUnit parallel
 * executor interleaves the two setup methods.
 */
@SpringBootTest(
    classes = Configuration.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Isolated
class MedicationBrandedProductNameTest {

  /**
   * NMPC branch path. {@link Models#getModelConfiguration(String)} converts {@code |} to {@code _}
   * for key lookup, so {@code "MAIN/SNOMEDCT-IE"} as a slash-separated path maps to the {@code
   * MAIN_SNOMEDCT-IE} config key after slash-to-pipe encoding + pipe-to-underscore normalisation.
   * Using the underscore form directly avoids any URL-filter involvement.
   */
  private static final String NMPC_BRANCH = "MAIN_SNOMEDCT-IE";

  /**
   * Real NMPC SCTIDs (pass Verhoeff validation) used as stand-ins for the form and brand name. The
   * validator checks only that these are valid concept IDs, not that they model the right concept
   * type. ECL lookups against them return empty (Snowstorm is mocked), so both become new concepts.
   */
  // NmpcConstants.VIRTUAL_MEDICINAL_PRODUCT — "660341000220102"
  private static final String GENERIC_FORM_ID = NmpcConstants.VIRTUAL_MEDICINAL_PRODUCT.getValue();

  // NmpcConstants.PACKAGE_NMPC — "689861000220100"
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
  void brandedProductNameReachesTheTpuuNewConceptForNmpc()
      throws ExecutionException, InterruptedException {
    // Arrange: minimal NMPC PackageDetails with brandedProductName set.
    PackageDetails<MedicationProductDetails> packageDetails =
        nmpcPackageWithBrandedName("Ongentys 50 mg hard capsules");

    // Act
    ProductSummary summary =
        productCalculationService.calculateProductFromAtomicData(NMPC_BRANCH, packageDetails);

    // Assert: the branded leaf product (TPUU / Actual Medicinal Product / REAL_CLINICAL_DRUG)
    // new-concept carries the name.
    //
    // Coverage note — the isNewConcept() guard in
    // MedicationProductCalculationService.postProductNodeCreationFunction is NOT explicitly
    // exercised
    // here: because Snowstorm is mocked to return empty ECL, every node becomes a new concept and
    // isNewConcept() is always true. The guard is verified by inspection and follows the identical
    // pattern used by the adjacent strengthFormat and nameGeneratorProductName transfer blocks.
    // An existing-concept negative path (isNewConcept() == false → brandedProductName NOT set) is
    // left to broader integration coverage.
    ModelLevelType leafLevel =
        models.getModelConfiguration(NMPC_BRANCH).getLeafProductModelLevel().getModelLevelType();

    Node tpuu =
        summary.getNodes().stream()
            .filter(Node::isNewConcept)
            .filter(n -> n.getModelLevel().equals(leafLevel))
            .findFirst()
            .orElseThrow(
                () ->
                    new AssertionError(
                        "No new-concept node found at TPUU (REAL_CLINICAL_DRUG) leaf level "
                            + leafLevel
                            + "; nodes were: "
                            + summary.getNodes()));

    assertThat(tpuu.getNewConceptDetails().getBrandedProductName())
        .isEqualTo("Ongentys 50 mg hard capsules");
  }

  @Test
  void brandedProductNameReachesTheVmpNewConceptForNmpc()
      throws ExecutionException, InterruptedException {
    // Arrange: minimal NMPC PackageDetails with brandedProductName set.
    PackageDetails<MedicationProductDetails> packageDetails =
        nmpcPackageWithBrandedName("Ongentys 50 mg hard capsules");

    // Act
    ProductSummary summary =
        productCalculationService.calculateProductFromAtomicData(NMPC_BRANCH, packageDetails);

    // Assert: the VMP (unbranded Virtual Medicinal Product, CLINICAL_DRUG) new-concept also
    // carries the branded product name — supplying it there helps the generator derive the
    // virtual name when the modelling is incomplete.
    //
    // Coverage note — the isNewConcept() guard in
    // MedicationProductCalculationService.postProductNodeCreationFunction is NOT explicitly
    // exercised here: because Snowstorm is mocked to return empty ECL, every node becomes a new
    // concept and isNewConcept() is always true. The guard is verified by inspection and follows
    // the identical pattern used by the adjacent strengthFormat and nameGeneratorProductName
    // transfer blocks. An existing-concept negative path (isNewConcept() == false →
    // brandedProductName NOT set) is left to broader integration coverage.
    Node vmp =
        summary.getNodes().stream()
            .filter(Node::isNewConcept)
            .filter(n -> n.getModelLevel().equals(ModelLevelType.CLINICAL_DRUG))
            .findFirst()
            .orElseThrow(
                () ->
                    new AssertionError(
                        "No new-concept node found at VMP (CLINICAL_DRUG) level; nodes were: "
                            + summary.getNodes()));

    assertThat(vmp.getNewConceptDetails().getBrandedProductName())
        .isEqualTo("Ongentys 50 mg hard capsules");
  }

  /**
   * Builds a minimal NMPC {@link PackageDetails} with a single contained product whose {@code
   * brandedProductName} is set to the given value. Uses empty active ingredients (NO_INGREDIENTS
   * template) to avoid BoSS ECL calls.
   */
  private static PackageDetails<MedicationProductDetails> nmpcPackageWithBrandedName(
      String brandedProductName) {
    MedicationProductDetails productDetails = new MedicationProductDetails();
    // genericForm is required by NmpcMedicationDetailsValidator.
    productDetails.setGenericForm(
        toSnowstormConceptMini(GENERIC_FORM_ID, "Virtual medicinal product (product)"));
    // productName (brand) is required by NmpcMedicationDetailsValidator.
    productDetails.setProductName(
        toSnowstormConceptMini(PRODUCT_NAME_ID, "Ongentys (product name)"));
    // No active ingredients → NO_INGREDIENTS template, avoids BoSS ECL calls.
    productDetails.setBrandedProductName(brandedProductName);

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
