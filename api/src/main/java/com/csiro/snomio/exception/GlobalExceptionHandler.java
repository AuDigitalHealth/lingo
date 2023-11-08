package com.csiro.snomio.exception;

import java.util.stream.Collectors;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {
  @ExceptionHandler(AuthenticationProblem.class)
  ProblemDetail handleAuthenticationProblem(AuthenticationProblem e) {
    return e.getBody();
  }

  @Override
  protected ResponseEntity<Object> handleMethodArgumentNotValid(
      MethodArgumentNotValidException ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    ProblemDetail detail =
        ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST,
            ex.getBindingResult().getFieldErrors().stream()
                .map(
                    fe ->
                        fe.getObjectName()
                            + "."
                            + fe.getField()
                            + " value "
                            + fe.getRejectedValue()
                            + " rejected: "
                            + fe.getDefaultMessage())
                .collect(Collectors.joining(". ")));
    return new ResponseEntity<>(detail, HttpStatus.BAD_REQUEST);
  }
}
