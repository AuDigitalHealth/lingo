package com.csiro.tickets.controllers.exceptions;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.zalando.problem.Problem;
import org.zalando.problem.spring.web.advice.ProblemHandling;
import reactor.core.publisher.Mono;

@RestControllerAdvice
public class ApiExceptionHandler implements ProblemHandling {

}
