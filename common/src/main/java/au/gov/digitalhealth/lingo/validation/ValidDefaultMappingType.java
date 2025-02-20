package au.gov.digitalhealth.lingo.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Constraint(validatedBy = DefaultMappingTypeValidator.class)
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidDefaultMappingType {
  String message() default "defaultMappingType must be one of the mappingTypes";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};
}
