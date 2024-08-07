package com.csiro.snomio.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.Collection;
import org.springframework.beans.BeanWrapperImpl;

public class OnlyOnePopulatedValidation implements ConstraintValidator<OnlyOnePopulated, Object> {

  private String[] fields;

  @Override
  public void initialize(OnlyOnePopulated constraintAnnotation) {
    this.fields = constraintAnnotation.fields();
  }

  @Override
  public boolean isValid(Object value, ConstraintValidatorContext context) {
    int i = 0;
    for (String field : fields) {
      Object propertyValue = new BeanWrapperImpl(value).getPropertyValue(field);
      if (propertyValue instanceof Collection<?> && !((Collection<?>) propertyValue).isEmpty()) {
        i++;
      }
    }

    return i <= 1;
  }
}
