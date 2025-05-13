package au.gov.digitalhealth.lingo.service.validators;

import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.details.DeviceProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.ProductQuantity;
import au.gov.digitalhealth.lingo.util.ValidationUtil;
import lombok.extern.java.Log;
import org.springframework.stereotype.Service;

@Service("AMT-DeviceDetailsValidator")
@Log
public class AmtDeviceValidator implements DeviceDetailsValidator {

  @Override
  public void validatePackageDetails(
      PackageDetails<DeviceProductDetails> packageDetails, String branch) {

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
      validateDeviceType(productQuantity.getProductDetails());
    }
  }

  private void validateDeviceType(DeviceProductDetails deviceProductDetails) {
    // validate device type is not null
    if (deviceProductDetails.getDeviceType() == null) {
      throw new ProductAtomicDataValidationProblem("Device type is required");
    }
  }
}
