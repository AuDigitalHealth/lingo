package com.csiro.snomio.exception;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {
  @ExceptionHandler(AuthenticationProblem.class)
  ProblemDetail handleAuthenticationProblem(AuthenticationProblem e) {
    return e.getBody();
  }
}
