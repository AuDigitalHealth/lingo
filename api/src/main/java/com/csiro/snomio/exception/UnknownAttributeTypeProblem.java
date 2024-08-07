package com.csiro.snomio.exception;

import com.csiro.tickets.models.AdditionalFieldType.Type;
import org.springframework.http.HttpStatus;

public class UnknownAttributeTypeProblem extends SnomioProblem {
  public UnknownAttributeTypeProblem(Type type) {
    super(
        "unknown-attribute-type",
        "Unknown attribute type",
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Attribute type " + type.name() + " is unknown");
  }
}
