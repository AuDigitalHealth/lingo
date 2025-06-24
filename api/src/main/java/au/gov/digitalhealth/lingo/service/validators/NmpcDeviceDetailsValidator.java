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
import au.gov.digitalhealth.lingo.util.ValidationUtil;
import lombok.extern.java.Log;
import org.springframework.stereotype.Service;

@Service("NMPC-DeviceDetailsValidator")
@Log
public class NmpcDeviceDetailsValidator extends DetailsValidator implements DeviceDetailsValidator {
  Models models;

  public NmpcDeviceDetailsValidator(Models models) {
    this.models = models;
  }

  @Override
  public void validatePackageDetails(
      PackageDetails<DeviceProductDetails> packageDetails, String branch) {

    validateNonDefiningProperties(
        packageDetails.getNonDefiningProperties(),
        ProductPackageType.PACKAGE,
        models.getModelConfiguration(branch));

    // device packages should not contain other packages
    if (!packageDetails.getContainedPackages().isEmpty()) {
      throw new ProductAtomicDataValidationProblem("Device packages cannot contain other packages");
    }

    // if specific device type is not null, other parent concepts must be null or empty
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
      // validate quantity is one if unit is each
      ValidationUtil.validateQuantityValueIsOneIfUnitIsEach(productQuantity);
      validateDeviceType(productQuantity.getProductDetails(), branch);
    }
  }

  private void validateDeviceType(DeviceProductDetails deviceProductDetails, String branch) {
    // validate device type is not null
    if (deviceProductDetails.getDeviceType() == null) {
      throw new ProductAtomicDataValidationProblem("Device type is required");
    }

    validateNonDefiningProperties(
        deviceProductDetails.getNonDefiningProperties(),
        ProductPackageType.PACKAGE,
        models.getModelConfiguration(branch));
  }
}
