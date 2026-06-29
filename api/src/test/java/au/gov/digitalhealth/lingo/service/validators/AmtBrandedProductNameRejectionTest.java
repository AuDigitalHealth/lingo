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
package au.gov.digitalhealth.lingo.service.validators;

import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.toSnowstormConceptMini;
import static org.assertj.core.api.Assertions.assertThat;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.gov.digitalhealth.lingo.configuration.Configuration;
import au.gov.digitalhealth.lingo.product.details.DeviceProductDetails;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.PackageQuantity;
import au.gov.digitalhealth.lingo.product.details.ProductQuantity;
import au.gov.digitalhealth.lingo.service.SnowstormClient;
import au.gov.digitalhealth.lingo.service.fhir.FhirClient;
import au.gov.digitalhealth.lingo.util.AmtConstants;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.MockReset;
import org.springframework.test.context.ActiveProfiles;

/**
 * Verifies that {@link AmtMedicationDetailsValidator} and {@link AmtDeviceValidator} reject a
 * non-blank {@code brandedProductName}. That field is NMPC-only; AMT does not support it.
 *
 * <p>{@link Isolated} prevents this class from running concurrently with other {@link
 * SpringBootTest} classes that share the same Spring application context and mock beans. Concurrent
 * mock setup on shared Mockito mocks can produce {@code WrongTypeOfReturnValue} errors when the
 * JUnit parallel executor interleaves stub registration from two test classes' setup methods.
 */
@SpringBootTest(
    classes = Configuration.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Isolated
class AmtBrandedProductNameRejectionTest {

  /**
   * AMT branch path key. {@link
   * au.gov.digitalhealth.lingo.configuration.model.Models#getModelConfiguration(String)} normalises
   * slashes to underscores, so the underscore form is used directly here to avoid any URL-filter
   * involvement.
   */
  private static final String AMT_BRANCH = "MAIN_SNOMEDCT-AU";

  @MockBean(reset = MockReset.NONE)
  SnowstormClient snowstormClient;

  @MockBean(reset = MockReset.NONE)
  FhirClient fhirClient;

  @Autowired AmtMedicationDetailsValidator medicationValidator;

  @Autowired AmtDeviceValidator deviceValidator;

  // -------------------------------------------------------------------------
  // Medication validator tests
  // -------------------------------------------------------------------------

  @Test
  void amtMedicationValidatorRejectsBrandedProductName() {
    PackageDetails<MedicationProductDetails> packageDetails =
        amtMedicationPackageWithBrandedName("Ongentys 50 mg hard capsules");

    ValidationResult result =
        medicationValidator.validatePackageDetails(
            packageDetails, AMT_BRANCH, snowstormClient, fhirClient);

    assertThat(result.getProblems())
        .anyMatch(p -> p.getMessage().toLowerCase().contains("branded product name"));
  }

  @Test
  void amtMedicationValidatorDoesNotRejectAbsentBrandedProductName() {
    PackageDetails<MedicationProductDetails> packageDetails =
        amtMedicationPackageWithBrandedName(null);

    ValidationResult result =
        medicationValidator.validatePackageDetails(
            packageDetails, AMT_BRANCH, snowstormClient, fhirClient);

    assertThat(result.getProblems())
        .noneMatch(p -> p.getMessage().toLowerCase().contains("branded product name"));
  }

  @Test
  void amtMedicationValidatorRejectsBrandedProductNameInNestedPackage() {
    PackageDetails<MedicationProductDetails> packageDetails =
        amtMedicationOuterPackageWithNestedBrandedName("Ongentys 50 mg hard capsules");

    ValidationResult result =
        medicationValidator.validatePackageDetails(
            packageDetails, AMT_BRANCH, snowstormClient, fhirClient);

    assertThat(result.getProblems())
        .anyMatch(p -> p.getMessage().toLowerCase().contains("branded product name"));
  }

  // -------------------------------------------------------------------------
  // Device validator tests
  // -------------------------------------------------------------------------

  @Test
  void amtDeviceValidatorRejectsBrandedProductName() {
    PackageDetails<DeviceProductDetails> packageDetails =
        amtDevicePackageWithBrandedName("AcmeGuard 5 mm catheter");

    ValidationResult result = deviceValidator.validatePackageDetails(packageDetails, AMT_BRANCH);

    assertThat(result.getProblems())
        .anyMatch(p -> p.getMessage().toLowerCase().contains("branded product name"));
  }

  @Test
  void amtDeviceValidatorDoesNotRejectAbsentBrandedProductName() {
    PackageDetails<DeviceProductDetails> packageDetails = amtDevicePackageWithBrandedName(null);

    ValidationResult result = deviceValidator.validatePackageDetails(packageDetails, AMT_BRANCH);

    assertThat(result.getProblems())
        .noneMatch(p -> p.getMessage().toLowerCase().contains("branded product name"));
  }

  // -------------------------------------------------------------------------
  // Builders
  // -------------------------------------------------------------------------

  /**
   * Builds a minimal AMT {@link PackageDetails} for a medication product with {@code
   * brandedProductName} set to the given value (may be {@code null}).
   *
   * <p>The product has no active ingredients (resolves to the NO_INGREDIENTS template, which is not
   * in the AMT supported set — that validation problem is expected and is harmless to the assertion
   * under test). A non-null unit with null conceptId is set on the product quantity so that {@link
   * au.gov.digitalhealth.lingo.util.ValidationUtil#validateQuantityValueIsOneIfUnitIsEach} does not
   * NPE.
   */
  private static PackageDetails<MedicationProductDetails> amtMedicationPackageWithBrandedName(
      String brandedProductName) {
    MedicationProductDetails productDetails = new MedicationProductDetails();
    productDetails.setBrandedProductName(brandedProductName);

    ProductQuantity<MedicationProductDetails> productQuantity = new ProductQuantity<>();
    productQuantity.setProductDetails(productDetails);
    productQuantity.setValue(BigDecimal.ONE);
    // Provide a non-null unit with null conceptId so validateQuantityValueIsOneIfUnitIsEach
    // does not NPE. A null conceptId means it is not equal to UNIT_OF_PRESENTATION → no problem
    // is added for the quantity itself.
    productQuantity.setUnit(new SnowstormConceptMini());

    PackageDetails<MedicationProductDetails> packageDetails = new PackageDetails<>();
    packageDetails.getContainedProducts().add(productQuantity);
    return packageDetails;
  }

  /**
   * Builds an outer {@link PackageDetails} that itself contains no direct products but one nested
   * {@link PackageQuantity} whose inner package holds a product with {@code brandedProductName} set
   * to the given value. Used to verify that {@link AmtMedicationDetailsValidator} scans nested
   * packages, not only the top-level {@code containedProducts}.
   */
  private static PackageDetails<MedicationProductDetails>
      amtMedicationOuterPackageWithNestedBrandedName(String brandedProductName) {
    // Inner package — mirrors amtMedicationPackageWithBrandedName
    PackageDetails<MedicationProductDetails> innerPackage =
        amtMedicationPackageWithBrandedName(brandedProductName);

    PackageQuantity<MedicationProductDetails> packageQuantity = new PackageQuantity<>();
    packageQuantity.setPackageDetails(innerPackage);
    packageQuantity.setValue(BigDecimal.ONE);
    packageQuantity.setUnit(new SnowstormConceptMini());

    PackageDetails<MedicationProductDetails> outerPackage = new PackageDetails<>();
    // The AMT medication validator NPEs on containedPackages unless containerType is non-null.
    // A non-null SnowstormConceptMini with null conceptId passes the null guard at line 374 and
    // then falls into the "container type not Pack" problem branch — harmless for this assertion.
    outerPackage.setContainerType(new SnowstormConceptMini());
    outerPackage.getContainedPackages().add(packageQuantity);
    return outerPackage;
  }

  /**
   * Builds a minimal AMT {@link PackageDetails} for a device product with {@code
   * brandedProductName} set to the given value (may be {@code null}).
   *
   * <p>The contained device has a non-null {@code deviceType} (required by {@link
   * AmtDeviceValidator#validatePackageDetails}) and a non-null unit so that quantity validation
   * does not NPE.
   */
  private static PackageDetails<DeviceProductDetails> amtDevicePackageWithBrandedName(
      String brandedProductName) {
    DeviceProductDetails productDetails = new DeviceProductDetails();
    // deviceType is required by AmtDeviceValidator.validateDeviceType().
    productDetails.setDeviceType(
        toSnowstormConceptMini(
            AmtConstants.HAS_DEVICE_TYPE.getValue(), AmtConstants.HAS_DEVICE_TYPE.getLabel()));
    productDetails.setBrandedProductName(brandedProductName);

    ProductQuantity<DeviceProductDetails> productQuantity = new ProductQuantity<>();
    productQuantity.setProductDetails(productDetails);
    productQuantity.setValue(BigDecimal.ONE);
    // Provide a non-null unit with null conceptId so validateQuantityValueIsOneIfUnitIsEach
    // does not NPE.
    productQuantity.setUnit(new SnowstormConceptMini());

    PackageDetails<DeviceProductDetails> packageDetails = new PackageDetails<>();
    packageDetails.getContainedProducts().add(productQuantity);
    return packageDetails;
  }
}
