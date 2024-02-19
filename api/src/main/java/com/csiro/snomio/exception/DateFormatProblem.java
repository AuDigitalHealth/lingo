package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class DateFormatProblem extends SnomioProblem {

  public DateFormatProblem(String message) {
    super("date-format-problem", "Date Format Problem", HttpStatus.BAD_REQUEST, message);
  }
}
