package com.csiro.snomio.validation;

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
