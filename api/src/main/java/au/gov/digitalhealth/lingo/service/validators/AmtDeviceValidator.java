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

import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.details.DeviceProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.ProductQuantity;
import au.gov.digitalhealth.lingo.product.details.ProductTemplate;
import au.gov.digitalhealth.lingo.product.details.ProductType;
import au.gov.digitalhealth.lingo.service.SnowstormClient;
import au.gov.digitalhealth.lingo.service.fhir.FhirClient;
import au.gov.digitalhealth.lingo.util.ValidationUtil;
import java.util.Set;
import lombok.extern.java.Log;
import org.springframework.stereotype.Service;

@SuppressWarnings("java:S6830")
@Service("AMT-DeviceDetailsValidator")
@Log
public class AmtDeviceValidator extends DetailsValidator implements DeviceDetailsValidator {

  private final SnowstormClient snowstormClient;
  private final FhirClient fhirClient;
  Models models;

  public AmtDeviceValidator(Models models, SnowstormClient snowstormClient, FhirClient fhirClient) {
    this.models = models;
    this.snowstormClient = snowstormClient;
    this.fhirClient = fhirClient;
  }

  @Override
  public ValidationResult validatePackageDetails(
      PackageDetails<DeviceProductDetails> packageDetails, String branch) {

    ValidationResult result = new ValidationResult();

    validateTypeParameters(packageDetails, result);

    validateNonDefiningProperties(
        snowstormClient,
        fhirClient,
        branch,
        packageDetails.getNonDefiningProperties(),
        ProductPackageType.PACKAGE,
        models.getModelConfiguration(branch),
        result);

    // device packages should not contain other packages
    if (!packageDetails.getContainedPackages().isEmpty()) {
      throw new ProductAtomicDataValidationProblem("Device packages cannot contain other packages");
    }

    // if the specific device type is not null, other parent concepts must be null or empty
    if (packageDetails.getContainedProducts().stream()
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
    if (packageDetails.getContainedProducts().isEmpty()) {
      throw new ProductAtomicDataValidationProblem(
          "Device packages must contain at least one device");
    }

    for (ProductQuantity<DeviceProductDetails> productQuantity :
        packageDetails.getContainedProducts()) {
      // validate quantity has a value of one if the unit is each
      ValidationUtil.validateQuantityValueIsOneIfUnitIsEach(productQuantity, result);
      validateDeviceType(productQuantity.getProductDetails(), branch, result);
    }
    return result;
  }

  private void validateDeviceType(
      DeviceProductDetails deviceProductDetails, String branch, ValidationResult result) {
    // validate device type is not null
    if (deviceProductDetails.getDeviceType() == null) {
      throw new ProductAtomicDataValidationProblem("Device type is required");
    }

    validateNonDefiningProperties(
        snowstormClient,
        fhirClient,
        branch,
        deviceProductDetails.getNonDefiningProperties(),
        ProductPackageType.PACKAGE,
        models.getModelConfiguration(branch),
        result);
  }

  @Override
  protected Set<ProductType> getSupportedProductTypes() {
    return Set.of(ProductType.DEVICE);
  }

  @Override
  protected Set<ProductTemplate> getSupportedProductTemplates() {
    return Set.of();
  }
}
