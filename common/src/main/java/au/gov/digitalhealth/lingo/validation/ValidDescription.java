package au.gov.digitalhealth.lingo.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Constraint(validatedBy = ValidDescriptionValidation.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidDescription {

  String fieldName() default "";

  String message() default "Must be a valid Concept Description";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};
}
