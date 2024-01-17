package com.csiro.snomio.exception;

import java.util.Set;
import org.springframework.http.HttpStatus;

public class NoFieldBindingsProblem extends SnomioProblem {
  public NoFieldBindingsProblem(String branch, Set<String> keys) {
    super(
        "no-field-bindings",
        "No field bindings configured",
        HttpStatus.BAD_REQUEST,
        "No field bindings are configured that match branch name "
            + branch
            + " configured options are "
            + String.join(", ", keys));
  }
}
