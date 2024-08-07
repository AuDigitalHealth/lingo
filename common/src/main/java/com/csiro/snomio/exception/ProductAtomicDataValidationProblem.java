package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class ProductAtomicDataValidationProblem extends SnomioProblem {

  public ProductAtomicDataValidationProblem(String message) {
    super(
        "atomic-data-validation-problem",
        "Atomic data validation problem",
        HttpStatus.BAD_REQUEST,
        message);
  }
}
