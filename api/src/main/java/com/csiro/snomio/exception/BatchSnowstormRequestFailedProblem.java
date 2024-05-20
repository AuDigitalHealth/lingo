package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class BatchSnowstormRequestFailedProblem extends SnomioProblem {

  public BatchSnowstormRequestFailedProblem(String message) {
    super("batch-failed", "Batch failed", HttpStatus.INTERNAL_SERVER_ERROR, message);
  }

  public BatchSnowstormRequestFailedProblem(Exception e) {
    super("batch-failed", "Batch failed", HttpStatus.INTERNAL_SERVER_ERROR, e);
  }
}
