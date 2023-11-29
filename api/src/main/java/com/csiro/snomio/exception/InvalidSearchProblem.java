package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class InvalidSearchProblem extends SnomioProblem {

  public InvalidSearchProblem(String message) {
    super(
        "invalid-search-parameters", "Invalid Search Parameters", HttpStatus.BAD_REQUEST, message);
  }
}
