package au.gov.digitalhealth.lingo.service.validators;

import au.gov.digitalhealth.lingo.product.details.DeviceProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import lombok.extern.java.Log;
import org.springframework.stereotype.Service;

@Service("NMPC-DeviceDetailsValidator")
@Log
public class NmpcDeviceDetailsValidator implements DeviceDetailsValidator {
  @Override
  public void validatePackageDetails(
      PackageDetails<DeviceProductDetails> packageDetails, String branch) {
    // TODO implement rules
  }
}
