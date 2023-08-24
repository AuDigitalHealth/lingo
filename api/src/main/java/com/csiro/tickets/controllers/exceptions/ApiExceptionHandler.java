package com.csiro.tickets.controllers.exceptions;

import java.lang.reflect.InvocationTargetException;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(value = ResourceNotFoundException.class)
  @ResponseStatus(value = HttpStatus.NOT_FOUND)
  public ErrorMessage resourceNotFoundException(ResourceNotFoundException ex) {
    return new ErrorMessage(
        HttpStatus.NOT_FOUND.value(), Instant.now(), ex.getMessage(), "Resource Not Found");
  }

  @ExceptionHandler(value = ClassNotFoundException.class)
  @ResponseStatus(value = HttpStatus.INTERNAL_SERVER_ERROR)
  public ErrorMessage classNotFoundException(ClassNotFoundException ex) {
    return new ErrorMessage(
        HttpStatus.INTERNAL_SERVER_ERROR.value(),
        Instant.now(),
        ex.getMessage(),
        "Class Not Found On The Classpath");
  }

  @ExceptionHandler(value = InvocationTargetException.class)
  @ResponseStatus(value = HttpStatus.INTERNAL_SERVER_ERROR)
  public ErrorMessage invocationTargetException(InvocationTargetException ex) {
    return new ErrorMessage(
        HttpStatus.INTERNAL_SERVER_ERROR.value(),
        Instant.now(),
        ex.getMessage(),
        "Failed To Invoke Method or Constructor");
  }
}
