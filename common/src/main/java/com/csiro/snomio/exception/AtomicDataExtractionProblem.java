package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class AtomicDataExtractionProblem extends SnomioProblem {
  public AtomicDataExtractionProblem(String message, String productId) {
    super(
        "atomic-data-extraction-problem",
        "Atomic data extraction problem",
        HttpStatus.INTERNAL_SERVER_ERROR,
        message + " for product " + productId);
  }
}
