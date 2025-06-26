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
import org.springframework.beans.BeanWrapperImpl;

/**
 * The AllNullOrAllNotNullValidation class is a constraint validator that checks if the specified
 * fields are either all null or all not null.
 */
public class AllNullOrAllNotNullValidation
    implements ConstraintValidator<AllNullOrAllNotNull, Object> {

  private String[] fields;

  @Override
  public void initialize(AllNullOrAllNotNull constraintAnnotation) {
    this.fields = constraintAnnotation.fields();
  }

  /**
   * Determines whether the specified fields are either all null or all not null.
   *
   * @param value The object to be validated.
   * @param context The validator context.
   * @return {@code true} if fields are either all null or all not null, {@code false} otherwise.
   */
  @Override
  public boolean isValid(Object value, ConstraintValidatorContext context) {
    if (fields.length < 2) {
      return true; // Not enough fields to validate
    }

    BeanWrapperImpl beanWrapper = new BeanWrapperImpl(value);

    // Get the first field's value to compare with others
    Object firstFieldValue = beanWrapper.getPropertyValue(fields[0]);
    boolean firstFieldEmpty = isEmpty(firstFieldValue);

    // Check that all other fields match the first field's emptiness
    for (int i = 1; i < fields.length; i++) {
      Object fieldValue = beanWrapper.getPropertyValue(fields[i]);
      boolean fieldEmpty = isEmpty(fieldValue);

      // If any field's emptiness doesn't match the first field, validation fails
      if (firstFieldEmpty != fieldEmpty) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if the given property value is empty.
   *
   * @param propertyValue The property value to be checked.
   * @return {@code true} if the property value is empty, {@code false} otherwise.
   */
  private boolean isEmpty(Object propertyValue) {
    return propertyValue == null;
  }
}
