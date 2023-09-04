package com.csiro.tickets.controllers.exceptions;

import org.zalando.problem.Status;

public class ResourceAlreadyExists extends SnomioProblem{
  public ResourceAlreadyExists(String message) {
    super("resource-already-exists", "Resource Already Exists", Status.CONFLICT, message);
  }
}
