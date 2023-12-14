package com.csiro.snomio.validation;

import com.csiro.snomio.util.PartionIdentifier;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.constraints.NotNull;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Constraint(validatedBy = ValidSctIdValidation.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidSctId {

  String message() default "Must be a valid SCTID";

  @NotNull
  PartionIdentifier partitionIdentifier();

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};
}
