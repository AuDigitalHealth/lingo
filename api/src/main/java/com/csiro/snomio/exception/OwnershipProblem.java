package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class OwnershipProblem extends SnomioProblem {

  public OwnershipProblem(String message) {
    super("ownership-problem", "Forbidden", HttpStatus.FORBIDDEN, message);
  }
}
