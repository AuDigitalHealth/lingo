package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class EmptyProductCreationProblem extends SnomioProblem {

  public EmptyProductCreationProblem() {
    super(
        "empty-product-creation-problem",
        "Empty product creation problem",
        HttpStatus.UNPROCESSABLE_ENTITY,
        "Product creation request did not contain any concepts to create");
  }
}
