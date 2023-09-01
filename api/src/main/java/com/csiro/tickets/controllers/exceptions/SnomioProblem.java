package com.csiro.tickets.controllers.exceptions;

import java.io.Serial;
import java.net.URI;
import org.zalando.problem.AbstractThrowableProblem;
import org.zalando.problem.Status;

@SuppressWarnings("java:S110")
public class SnomioProblem extends AbstractThrowableProblem {

  public static final String BASE_PROBLEM_TYPE_URI = "http://snomio.csiro.au/problem/";

  @Serial private static final long serialVersionUID = 1L;

  public SnomioProblem(String uriSubPath, String title, Status status, String detail) {
    super(toTypeUri(uriSubPath), title, status, detail);
  }

  public SnomioProblem(String uriSubPath, String title, Status status) {
    this(uriSubPath, title, status, null);
  }

  protected static URI toTypeUri(String subtype) {
    return URI.create(BASE_PROBLEM_TYPE_URI + subtype);
  }
}
