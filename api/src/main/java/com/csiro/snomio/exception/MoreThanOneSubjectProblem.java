package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class MoreThanOneSubjectProblem extends SnomioProblem {
  public MoreThanOneSubjectProblem(String s) {
    super(
        "more-than-one-subject-problem",
        "More than one subject problem",
        HttpStatus.BAD_REQUEST,
        s);
  }
}
