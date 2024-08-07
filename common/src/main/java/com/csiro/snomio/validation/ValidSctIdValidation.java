package com.csiro.snomio.validation;

import com.csiro.snomio.util.PartionIdentifier;
import com.csiro.snomio.util.SnomedIdentifierUtil;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.constraints.NotNull;

public class ValidSctIdValidation implements ConstraintValidator<ValidSctId, String> {

  private @NotNull PartionIdentifier partitionIdentifier;

  @Override
  public void initialize(ValidSctId constraintAnnotation) {
    this.partitionIdentifier = constraintAnnotation.partitionIdentifier();
  }

  @Override
  public boolean isValid(String value, ConstraintValidatorContext context) {
    return value == null || SnomedIdentifierUtil.isValid(value, partitionIdentifier);
  }
}
