package au.gov.digitalhealth.lingo.service.validators;

import au.gov.digitalhealth.lingo.configuration.FieldBindingConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.service.SnowstormClient;
import lombok.extern.java.Log;
import org.springframework.stereotype.Service;

@Service("NMPC-MedicationDetailsValidator")
@Log
public class NmpcMedicationDetailsValidator implements MedicationDetailsValidator {
  Models models;
  SnowstormClient snowstormClient;
  FieldBindingConfiguration fieldBindingConfiguration;

  public NmpcMedicationDetailsValidator(
      Models models,
      SnowstormClient snowstormClient,
      FieldBindingConfiguration fieldBindingConfiguration) {
    this.models = models;
    this.snowstormClient = snowstormClient;
    this.fieldBindingConfiguration = fieldBindingConfiguration;
  }

  @Override
  public void validatePackageDetails(
      PackageDetails<MedicationProductDetails> packageDetails, String branch) {
    // TODO implement rules

  }
}
