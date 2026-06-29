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

import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.toSnowstormConceptMini;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormItemsPageReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormItemsPageRelationship;
import au.gov.digitalhealth.lingo.configuration.Configuration;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.DeviceProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.ProductQuantity;
import au.gov.digitalhealth.lingo.service.namegenerator.NameGenerationClient;
import au.gov.digitalhealth.lingo.util.NmpcConstants;
import au.gov.digitalhealth.lingo.util.SnomedConstants;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.MockReset;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Verifies that {@link DeviceProductCalculationService} transfers the user-supplied {@code
 * brandedProductName} from the product details onto the new-concept preferred term of the branded
 * leaf product (AMP / REAL_CLINICAL_DRUG) for NMPC device calculations.
 *
 * <p>Snowstorm is mocked so this test does not require a running Snowstorm instance and works
 * without the AMT-only Testcontainers dataset used by the rest of the test suite. The name-
 * generation client is also mocked; devices build names inline, not via the name generator.
 *
 * <p>{@link Isolated} prevents this class from running concurrently with other {@link
 * SpringBootTest} classes that share the same Spring application context and mock beans (e.g.
 * {@link MedicationBrandedProductNameTest}). Concurrent {@code @BeforeEach} stub registration on a
 * shared Mockito mock can produce {@code WrongTypeOfReturnValue} errors when the JUnit parallel
 * executor interleaves the two setup methods.
 */
@SpringBootTest(
    classes = Configuration.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Isolated
class DeviceBrandedProductNameTest {

  /**
   * NMPC branch path. {@link Models#getModelConfiguration(String)} converts {@code |} to {@code _}
   * for key lookup, so {@code "MAIN/SNOMEDCT-IE"} as a slash-separated path maps to the {@code
   * MAIN_SNOMEDCT-IE} config key after slash-to-pipe encoding + pipe-to-underscore normalisation.
   * Using the underscore form directly avoids any URL-filter involvement.
   */
  private static final String NMPC_BRANCH = "MAIN_SNOMEDCT-IE";

  /**
   * A real NMPC SCTID (passes Verhoeff validation) used as a stand-in for the device type concept.
   * The ECL lookup against it returns empty (Snowstorm is mocked), so the node becomes a new
   * concept.
   */
  private static final String DEVICE_TYPE_ID = NmpcConstants.CONTAINS_DEVICE_NMPC.getValue();

  /**
   * A real NMPC SCTID used as the product name (brand) concept. Required by the {@code
   * AuthoringValidation} constraint on {@code ProductDetails.productName}.
   */
  private static final String PRODUCT_NAME_ID = NmpcConstants.PACKAGE_NMPC.getValue();

  /** SCTID for "Unit of presentation" — used as the quantity unit. */
  private static final String UNIT_OF_PRESENTATION_ID =
      SnomedConstants.UNIT_OF_PRESENTATION.getValue();

  /**
   * NMPC module ID. Returned on refreshed concepts so {@link
   * au.gov.digitalhealth.lingo.product.OriginalNode#isExternalConcept} can determine externality.
   */
  private static final String NMPC_MODULE_ID = "1601000220105";

  @MockBean(reset = MockReset.NONE)
  SnowstormClient snowstormClient;

  @MockBean(reset = MockReset.NONE)
  NameGenerationClient nameGenerationClient;

  @Autowired DeviceProductCalculationService deviceProductCalculationService;

  @Autowired Models models;

  @BeforeEach
  void stubMocks() {
    // ECL lookups return nothing → every generated node becomes a new concept.
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

    // updateConceptReferences refreshes all concepts via getConceptsById.
    // Return all referenced concepts so getConceptOrThrow does not throw.
    // moduleId is set so OriginalNode.isExternalConcept can determine externality when
    // populateNodeProperties processes the existing device-type node.
    SnowstormConceptMini deviceTypeConcept =
        toSnowstormConceptMini(DEVICE_TYPE_ID, "Contains device (attribute)")
            .moduleId(NMPC_MODULE_ID);
    SnowstormConceptMini productNameConcept =
        toSnowstormConceptMini(PRODUCT_NAME_ID, "Package (product)").moduleId(NMPC_MODULE_ID);
    SnowstormConceptMini unitConcept =
        toSnowstormConceptMini(
                UNIT_OF_PRESENTATION_ID, "Unit of presentation (unit of presentation)")
            .moduleId(NMPC_MODULE_ID);
    when(snowstormClient.getConceptsById(anyString(), any()))
        .thenReturn(List.of(deviceTypeConcept, productNameConcept, unitConcept));

    // populateNodeProperties calls these reactive Snowstorm APIs when loading the device-type node.
    // Return empty/no-op stubs so the reactive pipeline completes without side effects.
    when(snowstormClient.getHistoricalAssociations(anyString(), anyString()))
        .thenReturn(Mono.just(List.of()));
    when(snowstormClient.getBrowserConcepts(anyString(), any())).thenReturn(Flux.empty());
    when(snowstormClient.getRefsetMembers(anyString(), any(), any(), anyInt(), anyInt()))
        .thenReturn(Mono.just(new SnowstormItemsPageReferenceSetMember().items(List.of())));
    when(snowstormClient.getRelationships(anyString(), anyString()))
        .thenReturn(Mono.just(new SnowstormItemsPageRelationship().items(List.of())));
  }

  @Test
  void brandedProductNameBecomesAmpPreferredTermForNmpcDevice() {
    // Arrange: minimal NMPC device PackageDetails with brandedProductName set.
    PackageDetails<DeviceProductDetails> packageDetails =
        nmpcDevicePackageWithBrandedName("AcmeGuard 5 mm catheter");

    // Act
    ProductSummary summary =
        deviceProductCalculationService.calculateProductFromAtomicData(NMPC_BRANCH, packageDetails);

    // Assert: the branded leaf product (AMP / REAL_CLINICAL_DRUG) new-concept carries the name.
    //
    // Coverage note — the isNewConcept() guard in createSummaryForContainedProduct is NOT
    // explicitly exercised here: because Snowstorm is mocked to return empty ECL, every generated
    // node becomes a new concept and isNewConcept() is always true. The guard is verified by
    // inspection and follows the same pattern used by analogous blocks in this service.
    // An existing-concept negative path (isNewConcept() == false → brandedProductName NOT set)
    // is left to broader integration coverage.
    ModelLevelType leafLevel =
        models.getModelConfiguration(NMPC_BRANCH).getLeafProductModelLevel().getModelLevelType();

    Node amp =
        summary.getNodes().stream()
            .filter(Node::isNewConcept)
            .filter(n -> n.getModelLevel().equals(leafLevel))
            .findFirst()
            .orElseThrow(
                () ->
                    new AssertionError(
                        "No new-concept node found at AMP (REAL_CLINICAL_DRUG) leaf level "
                            + leafLevel
                            + "; nodes were: "
                            + summary.getNodes()));

    assertThat(amp.getNewConceptDetails().getPreferredTerm()).isEqualTo("AcmeGuard 5 mm catheter");
  }

  /**
   * Builds a minimal NMPC {@link PackageDetails} for a device product with {@code
   * brandedProductName} set to the given value.
   *
   * <p>Required fields:
   *
   * <ul>
   *   <li>{@code productName} — {@code AuthoringValidation} group marks it non-null.
   *   <li>{@code deviceType} — required by {@code NmpcDeviceDetailsValidator}.
   *   <li>{@code newSpecificDeviceName} — satisfies the {@code @OnlyOneNotEmpty} class-level
   *       constraint that mandates exactly one of {@code newSpecificDeviceName} or {@code
   *       specificDeviceType}.
   * </ul>
   */
  private static PackageDetails<DeviceProductDetails> nmpcDevicePackageWithBrandedName(
      String brandedProductName) {
    DeviceProductDetails productDetails = new DeviceProductDetails();
    // productName is required (AuthoringValidation allowNull = false).
    productDetails.setProductName(toSnowstormConceptMini(PRODUCT_NAME_ID, "Package (product)"));
    // deviceType is required by NmpcDeviceDetailsValidator.
    productDetails.setDeviceType(
        toSnowstormConceptMini(DEVICE_TYPE_ID, "Contains device (attribute)"));
    // @OnlyOneNotEmpty requires exactly one of newSpecificDeviceName / specificDeviceType.
    productDetails.setNewSpecificDeviceName("catheter");
    productDetails.setBrandedProductName(brandedProductName);

    ProductQuantity<DeviceProductDetails> productQuantity = new ProductQuantity<>();
    productQuantity.setProductDetails(productDetails);
    // Unit and value are required by
    // NmpcDeviceDetailsValidator.validateQuantityValueIsOneIfUnitIsEach.
    productQuantity.setValue(BigDecimal.ONE);
    productQuantity.setUnit(
        toSnowstormConceptMini(
            UNIT_OF_PRESENTATION_ID, "Unit of presentation (unit of presentation)"));

    PackageDetails<DeviceProductDetails> packageDetails = new PackageDetails<>();
    packageDetails.getContainedProducts().add(productQuantity);
    return packageDetails;
  }
}
