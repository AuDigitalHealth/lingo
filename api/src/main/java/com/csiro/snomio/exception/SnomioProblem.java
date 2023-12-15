package com.csiro.snomio.exception;

import java.io.Serial;
import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

@SuppressWarnings("java:S110")
public class SnomioProblem extends ErrorResponseException {

  public static final String BASE_PROBLEM_TYPE_URI = "http://snomio.csiro.au/problem/";

  @Serial private static final long serialVersionUID = 1L;

  public SnomioProblem(String uriSubPath, String title, HttpStatus status, String detail) {
    super(status, asProblemDetail(uriSubPath, status, title, detail), null);
  }

  public SnomioProblem(String uriSubPath, String title, HttpStatus status) {
    this(uriSubPath, title, status, null);
  }

  protected static URI toTypeUri(String subtype) {
    return URI.create(BASE_PROBLEM_TYPE_URI + subtype);
  }

  protected static ProblemDetail asProblemDetail(
      String uriSubPath, HttpStatus status, String title, String detail) {
    ProblemDetail problemDetail = ProblemDetail.forStatus(status);
    problemDetail.setTitle(title);
    problemDetail.setType(toTypeUri(uriSubPath));
    problemDetail.setDetail(detail);
    return problemDetail;
  }
}
