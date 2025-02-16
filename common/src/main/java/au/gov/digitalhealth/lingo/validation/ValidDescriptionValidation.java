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
package au.gov.digitalhealth.lingo.validation;

import au.gov.digitalhealth.lingo.util.SnomedIdentifierUtil;
import jakarta.annotation.PostConstruct;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ValidDescriptionValidation implements ConstraintValidator<ValidDescription, String> {

  private static final Logger log = LoggerFactory.getLogger(ValidDescriptionValidation.class);

  private Pattern invalidCharPattern;
  private boolean validationActive = false; // Flag to indicate if validation is active

  @Value("${description.validation.regex:}")
  private String descriptionValidationRegex;

  private String fieldName;

  /**
   * Initializes the regex pattern after dependency injection is complete.
   * Logs a warning if no regex is provided, indicating that all strings will be considered valid.
   */
  @PostConstruct
  private void initPattern() {
    if (descriptionValidationRegex == null || descriptionValidationRegex.trim().isEmpty()) {
      log.warn("No description validation regex provided (description.validation.regex). " +
          "All strings will be considered valid.");
      validationActive = false;
    } else {
      try {
        invalidCharPattern = Pattern.compile(descriptionValidationRegex);
        log.info("Description validation pattern initialized with regex: {}", descriptionValidationRegex);
        validationActive = true;
      } catch (PatternSyntaxException e) {
        throw new IllegalArgumentException("Invalid regex in description.validation.regex property.", e);
      }
    }
  }

  /**
   * Initializes the validator.
   *
   * @param constraintAnnotation The annotation instance for a given constraint declaration.
   */
  @Override
  public void initialize(ValidDescription constraintAnnotation) {
    this.fieldName = constraintAnnotation.fieldName();
  }

  /**
   * Implements the validation logic.
   *
   * @param value   The string value to validate.
   * @param context Context in which the constraint is evaluated.
   * @return True if validation is inactive or if the value is a valid description, false otherwise.
   */
  @Override
  public boolean isValid(String value, ConstraintValidatorContext context) {
    if (!validationActive || value == null || isValidDescription(value)) {
      return true;
    }

    context.disableDefaultConstraintViolation();

    String messageTemplate = (fieldName == null || fieldName.isEmpty() ? "" : fieldName + ": ")
        + "Invalid Concept Description. Value: '" + value + "' contains invalid characters.";

    context.buildConstraintViolationWithTemplate(messageTemplate)
        .addConstraintViolation();

    log.warn("Validation failed for value: '{}'", value);
    return false;
  }

  /**
   * Checks if a string is a valid description based on the configured regex pattern.
   *
   * @param value The string value to check.
   * @return True if validation is inactive or if the string is a valid description, false otherwise.
   */
  private boolean isValidDescription(String value) {
    return !invalidCharPattern.matcher(value).find();
  }
}