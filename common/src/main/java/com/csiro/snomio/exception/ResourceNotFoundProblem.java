package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundProblem extends SnomioProblem {
  public ResourceNotFoundProblem(String message) {
    super("resource-not-found", "Resource Not Found", HttpStatus.NOT_FOUND, message);
  }
}
