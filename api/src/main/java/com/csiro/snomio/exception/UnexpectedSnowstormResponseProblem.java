package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class UnexpectedSnowstormResponseProblem extends SnomioProblem {

  public UnexpectedSnowstormResponseProblem(String message) {
    super(
        "unexpected-snowstorm-response",
        "Unexpected Snowstorm response",
        HttpStatus.INTERNAL_SERVER_ERROR,
        message);
  }
}
