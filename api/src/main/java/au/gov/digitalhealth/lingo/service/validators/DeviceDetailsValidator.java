package au.gov.digitalhealth.lingo.service.validators;

import au.gov.digitalhealth.lingo.product.details.DeviceProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;

public interface DeviceDetailsValidator {

  void validatePackageDetails(
      PackageDetails<DeviceProductDetails> packageDetails, String branch);
}
