package au.gov.digitalhealth.lingo.service.validators;

import au.gov.digitalhealth.lingo.configuration.model.ExternalIdentifierDefinition;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import java.util.Map;

public interface MedicationDetailsValidator {

  static void validateExternalIdentifier(
      ExternalIdentifier externalIdentifier,
      Map<String, ExternalIdentifierDefinition> mappingRefsets) {
    if (!mappingRefsets.containsKey(externalIdentifier.getIdentifierScheme())) {
      throw new ProductAtomicDataValidationProblem(
          "External identifier scheme "
              + externalIdentifier.getIdentifierScheme()
              + " is not valid for this product");
    }
    ExternalIdentifierDefinition externalIdentifierDefinition =
        mappingRefsets.get(externalIdentifier.getIdentifierScheme());
    if (!externalIdentifierDefinition
        .getMappingTypes()
        .contains(externalIdentifier.getRelationshipType())) {
      throw new ProductAtomicDataValidationProblem(
          "External identifier relationship type "
              + externalIdentifier.getRelationshipType()
              + " is not valid for scheme "
              + externalIdentifier.getIdentifierScheme());
    }
    if (!externalIdentifierDefinition.getDataType().isValidValue(externalIdentifier.getValue())) {
      throw new ProductAtomicDataValidationProblem(
          "External identifier value "
              + externalIdentifier.getValue()
              + " is not valid for scheme "
              + externalIdentifier.getIdentifierScheme());
    }
    if (externalIdentifierDefinition.getValueRegexValidation() != null
        && !externalIdentifier
            .getValue()
            .matches(externalIdentifierDefinition.getValueRegexValidation())) {
      throw new ProductAtomicDataValidationProblem(
          "External identifier value "
              + externalIdentifier.getValue()
              + " does not match the regex validation for scheme "
              + externalIdentifier.getIdentifierScheme());
    }
  }

  void validatePackageDetails(
      PackageDetails<MedicationProductDetails> packageDetails, String branch);
}
