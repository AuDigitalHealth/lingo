package com.csiro.tickets.controllers.exceptions;

import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.zalando.problem.spring.web.advice.ProblemHandling;

@RestControllerAdvice
public class ApiExceptionHandler implements ProblemHandling {}
