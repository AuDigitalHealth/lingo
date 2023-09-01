package com.csiro.tickets.controllers.exceptions;

import org.zalando.problem.Status;

@SuppressWarnings("java:S110")
public class ResourceNotFoundProblem extends SnomioProblem {
  public ResourceNotFoundProblem(String message) {
    super("resource-not-found", "Resource Not Found", Status.NOT_FOUND, message);
  }
}
