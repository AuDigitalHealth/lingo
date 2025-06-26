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

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import jakarta.validation.ConstraintValidatorContext;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class AllNullOrAllNotNullValidationTest {

  private AllNullOrAllNotNullValidation validator;

  @Mock private AllNullOrAllNotNull allNullOrAllNotNull;

  @Mock private ConstraintValidatorContext context;

  @BeforeEach
  public void setUp() {
    MockitoAnnotations.openMocks(this);
    validator = new AllNullOrAllNotNullValidation();
  }

  @Test
  void testIsValid() {
    when(allNullOrAllNotNull.fields()).thenReturn(new String[] {"field1", "field2"});
    validator.initialize(allNullOrAllNotNull);

    // All fields null - valid
    assertTrue(validator.isValid(new TestObject(null, null), context));

    // All fields not null - valid
    assertTrue(validator.isValid(new TestObject(BigDecimal.ONE, "value"), context));

    // One field null, one not null - invalid
    assertFalse(validator.isValid(new TestObject(BigDecimal.ONE, null), context));
    assertFalse(validator.isValid(new TestObject(null, "value"), context));

    // Test with different non-null values - valid
    assertTrue(validator.isValid(new TestObject(BigDecimal.TEN, "different value"), context));
  }

  @Test
  void testIsValidWithMoreThanTwoFields() {
    when(allNullOrAllNotNull.fields()).thenReturn(new String[] {"field1", "field2", "field3"});
    validator.initialize(allNullOrAllNotNull);

    // All fields null - valid
    assertTrue(validator.isValid(new TestObjectWithThreeFields(null, null, null), context));

    // All fields not null - valid
    assertTrue(
        validator.isValid(
            new TestObjectWithThreeFields(BigDecimal.ONE, "value", "another"), context));

    // Mixed null and not null - invalid
    assertFalse(
        validator.isValid(new TestObjectWithThreeFields(BigDecimal.ONE, "value", null), context));
    assertFalse(
        validator.isValid(new TestObjectWithThreeFields(null, "value", "another"), context));
    assertFalse(
        validator.isValid(new TestObjectWithThreeFields(BigDecimal.ONE, null, "another"), context));
  }

  @Test
  void testIsValidWithLessThanTwoFields() {
    when(allNullOrAllNotNull.fields()).thenReturn(new String[] {"field1"});
    validator.initialize(allNullOrAllNotNull);

    // With less than two fields, validation should always pass
    assertTrue(validator.isValid(new TestObject(null, null), context));
    assertTrue(validator.isValid(new TestObject(BigDecimal.ONE, null), context));
  }

  private record TestObject(BigDecimal field1, String field2) {}

  private record TestObjectWithThreeFields(BigDecimal field1, String field2, String field3) {}
}
