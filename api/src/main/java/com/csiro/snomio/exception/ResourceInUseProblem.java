package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class ResourceInUseProblem extends SnomioProblem {

  public ResourceInUseProblem(String message) {
    super("resource-in-use", "Resource in use", HttpStatus.CONFLICT, message);
  }
}
