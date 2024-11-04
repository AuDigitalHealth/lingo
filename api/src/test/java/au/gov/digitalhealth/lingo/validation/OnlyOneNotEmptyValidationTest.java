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
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class OnlyOneNotEmptyValidationTest {

  private OnlyOneNotEmptyValidation validator;

  @Mock private OnlyOneNotEmpty onlyOneNotEmpty;

  @Mock private ConstraintValidatorContext context;

  @BeforeEach
  public void setUp() {
    MockitoAnnotations.openMocks(this);
    validator = new OnlyOneNotEmptyValidation();
  }

  @Test
  void testIsValid() {
    when(onlyOneNotEmpty.fields()).thenReturn(new String[] {"field1", "field2"});
    validator.initialize(onlyOneNotEmpty);

    assertTrue(validator.isValid(new TestObject("value", null), context));
    assertTrue(validator.isValid(new TestObject(null, List.of("value")), context));
    assertFalse(validator.isValid(new TestObject("value", List.of("value")), context));
    assertFalse(validator.isValid(new TestObject(null, Collections.emptyList()), context));
    assertFalse(validator.isValid(new TestObject(null, null), context));
    assertFalse(validator.isValid(new TestObject("value", List.of("value1", "value2")), context));
    assertFalse(validator.isValid(new TestObject("value1", List.of("value")), context));
    assertTrue(validator.isValid(new TestObject("", List.of("value")), context));
    assertFalse(validator.isValid(new TestObject("value", List.of("")), context));
    assertTrue(validator.isValid(new TestObject("", List.of("")), context));
  }

  private record TestObject(String field1, Collection<String> field2) {}
}
