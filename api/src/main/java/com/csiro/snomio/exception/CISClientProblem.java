package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class CISClientProblem extends SnomioProblem {
  public CISClientProblem(String message) {
    super(
        "cis-integration",
        "CIS client integration problem",
        HttpStatus.INTERNAL_SERVER_ERROR,
        message);
  }

  public CISClientProblem(String message, Throwable e) {
    super(
        "cis-integration",
        "CIS client integration problem",
        HttpStatus.INTERNAL_SERVER_ERROR,
        message,
        e);
  }

  public static CISClientProblem cisClientProblemForOperation(String operation, Throwable e) {
    return new CISClientProblem("Failed to " + operation + " identifiers.", e);
  }

  public static CISClientProblem cisClientProblemForOperation(String operation) {
    return new CISClientProblem("Failed to " + operation + " identifiers.");
  }
}
