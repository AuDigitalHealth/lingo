package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class AuthenticationProblem extends SnomioProblem {
  public AuthenticationProblem(String message) {
    super("access-denied", "Forbidden", HttpStatus.FORBIDDEN, message);
  }
}
