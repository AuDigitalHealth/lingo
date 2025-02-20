package au.gov.digitalhealth.lingo.validation;

import au.gov.digitalhealth.lingo.configuration.model.MappingRefset;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class DefaultMappingTypeValidator
    implements ConstraintValidator<ValidDefaultMappingType, MappingRefset> {

  @Override
  public boolean isValid(MappingRefset mappingRefset, ConstraintValidatorContext context) {
    if (mappingRefset.getDefaultMappingType() == null) {
      return true; // If defaultMappingType is not set, no validation needed
    }
    return mappingRefset.getMappingTypes().contains(mappingRefset.getDefaultMappingType());
  }
}
