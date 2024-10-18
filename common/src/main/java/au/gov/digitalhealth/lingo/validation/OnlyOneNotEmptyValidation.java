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

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.Collection;
import org.springframework.beans.BeanWrapperImpl;

/**
 * The OnlyOneNotEmptyValidation class is a constraint validator that checks if only one field is
 * populated out of the specified fields.
 */
public class OnlyOneNotEmptyValidation implements ConstraintValidator<OnlyOneNotEmpty, Object> {

  private String[] fields;

  @Override
  public void initialize(OnlyOneNotEmpty constraintAnnotation) {
    this.fields = constraintAnnotation.fields();
  }

  /**
   * Determines whether only one field is populated out of the specified fields.
   *
   * @param value The object to be validated.
   * @param context The validator context.
   * @return {@code true} if only one field is populated, {@code false} otherwise.
   */
  @Override
  public boolean isValid(Object value, ConstraintValidatorContext context) {
    int nonEmptyFieldsCount = 0;
    for (String field : fields) {
      Object propertyValue = new BeanWrapperImpl(value).getPropertyValue(field);
      if (isNotEmpty(propertyValue)) {
        nonEmptyFieldsCount++;
      }
    }
    return nonEmptyFieldsCount == 1;
  }

  /**
   * Checks if the given property value is not empty.
   *
   * @param propertyValue The property value to be checked.
   * @return {@code true} if the property value is not empty, {@code false} otherwise.
   */
  private boolean isNotEmpty(Object propertyValue) {
    if (propertyValue == null) {
      return false;
    }
    if (propertyValue instanceof Collection<?> c) {
      return !c.isEmpty();
    } else if (propertyValue instanceof Object[] o) {
      return o.length > 0;
    } else if (propertyValue instanceof String s) {
      return !s.isBlank();
    }
    return true; // any other object just not null is good enough
  }
}
