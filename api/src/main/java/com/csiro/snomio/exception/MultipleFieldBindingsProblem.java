package com.csiro.snomio.exception;

import java.util.Set;
import org.springframework.http.HttpStatus;

public class MultipleFieldBindingsProblem extends SnomioProblem {
  public MultipleFieldBindingsProblem(String branch, Set<String> keys) {
    super(
        "multiple-field-bindings",
        "Multiple field bindings configured",
        HttpStatus.BAD_REQUEST,
        "Multiple field bindings are configured that match branch name "
            + branch
            + " matching configurations were "
            + String.join(", ", keys));
  }
}
