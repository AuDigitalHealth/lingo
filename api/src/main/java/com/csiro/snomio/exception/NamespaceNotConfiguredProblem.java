package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class NamespaceNotConfiguredProblem extends SnomioProblem {
  public NamespaceNotConfiguredProblem(String key) {
    super(
        "namespace-not-configured",
        "Namespace not configured: " + key,
        HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
