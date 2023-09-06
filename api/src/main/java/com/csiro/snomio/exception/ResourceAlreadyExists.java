package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class ResourceAlreadyExists extends SnomioProblem {

  public ResourceAlreadyExists(String message) {
    super("resource-already-exists", "Resource Already Exists", HttpStatus.CONFLICT, message);
  }
}
