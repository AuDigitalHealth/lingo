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

import au.gov.digitalhealth.lingo.configuration.model.BasePropertyWithValueDefinition;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;
import lombok.extern.java.Log;

@Log
public class AllowedValuesValidator
    implements ConstraintValidator<ValidAllowedValues, BasePropertyWithValueDefinition> {

  @Override
  public boolean isValid(
      BasePropertyWithValueDefinition property, ConstraintValidatorContext context) {
    if (property.getAllowedValues() == null || property.getAllowedValues().isEmpty()) {
      return true; // No allowed values to validate
    }

    Pattern regexPattern =
        property.getValueRegexValidation() != null
            ? Pattern.compile(property.getValueRegexValidation())
            : null;

    for (String value : property.getAllowedValues()) {
      if (regexPattern != null && !regexPattern.matcher(value).matches()) {
        return false; // Value does not match the regex
      }

      if (!property.getDataType().isValidValue(value)) {
        return false; // Value does not match the data type
      }
    }

    return true;
  }
}
