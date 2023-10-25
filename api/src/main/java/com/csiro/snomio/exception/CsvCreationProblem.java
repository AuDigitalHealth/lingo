package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class CsvCreationProblem extends SnomioProblem {

  public CsvCreationProblem(String message) {
    super(
        "file-creation-problem", "Error Creating File", HttpStatus.INTERNAL_SERVER_ERROR, message);
  }
}
