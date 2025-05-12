package au.gov.digitalhealth.lingo.service.validators;

import au.gov.digitalhealth.lingo.configuration.model.MappingRefset;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import java.util.Map;

public interface MedicationDetailsValidator {

  static void validateExternalIdentifier(
      ExternalIdentifier externalIdentifier, Map<String, MappingRefset> mappingRefsets) {
    if (!mappingRefsets.containsKey(externalIdentifier.getIdentifierScheme())) {
      throw new ProductAtomicDataValidationProblem(
          "External identifier scheme "
              + externalIdentifier.getIdentifierScheme()
              + " is not valid for this product");
    }
    MappingRefset mappingRefset = mappingRefsets.get(externalIdentifier.getIdentifierScheme());
    if (!mappingRefset.getMappingTypes().contains(externalIdentifier.getRelationshipType())) {
      throw new ProductAtomicDataValidationProblem(
          "External identifier relationship type "
              + externalIdentifier.getRelationshipType()
              + " is not valid for scheme "
              + externalIdentifier.getIdentifierScheme());
    }
    if (!mappingRefset.getDataType().isValidValue(externalIdentifier.getIdentifierValue())) {
      throw new ProductAtomicDataValidationProblem(
          "External identifier value "
              + externalIdentifier.getIdentifierValue()
              + " is not valid for scheme "
              + externalIdentifier.getIdentifierScheme());
    }
    if (mappingRefset.getValueRegexValidation() != null
        && !externalIdentifier
            .getIdentifierValue()
            .matches(mappingRefset.getValueRegexValidation())) {
      throw new ProductAtomicDataValidationProblem(
          "External identifier value "
              + externalIdentifier.getIdentifierValue()
              + " does not match the regex validation for scheme "
              + externalIdentifier.getIdentifierScheme());
    }
  }

  void validatePackageDetails(
      PackageDetails<MedicationProductDetails> packageDetails, String branch);
}
