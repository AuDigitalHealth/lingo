package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class ProductModelProblem extends SnomioProblem {

  public ProductModelProblem(String type, Long productId, SingleConceptExpectedProblem e) {
    super(
        "product-model-problem",
        "Product model problem",
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Product " + productId + " is expected to have 1 " + type + " but has " + e.getSize());
  }
}
