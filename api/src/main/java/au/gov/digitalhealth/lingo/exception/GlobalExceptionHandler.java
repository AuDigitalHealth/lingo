/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.lingo.exception;

import au.gov.digitalhealth.lingo.auth.exception.AuthenticationProblem;
import com.drew.lang.annotations.Nullable;
import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.http.*;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
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
            Stream.concat(
                    ex.getBindingResult().getFieldErrors().stream()
                        .map(
                            fe ->
                                fe.getObjectName()
                                    + "."
                                    + fe.getField()
                                    + " value "
                                    + fe.getRejectedValue()
                                    + " rejected: "
                                    + fe.getDefaultMessage()),
                    ex.getBindingResult().getGlobalErrors().stream()
                        .map(ge -> ge.getObjectName() + " rejected: " + ge.getDefaultMessage()))
                .collect(Collectors.joining(". ")));
    return new ResponseEntity<>(detail, HttpStatus.BAD_REQUEST);
  }

  @Override
  @Nullable
  protected ResponseEntity<Object> handleHandlerMethodValidationException(
      HandlerMethodValidationException ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {

    ProblemDetail problemDetail =
        ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failure");
    problemDetail.setType(URI.create("about:blank"));

    List<Map<String, String>> errorList = new ArrayList<>();
    ex.getAllErrors()
        .forEach(
            (error) -> {
              Map<String, String> errorMap = new HashMap<>();
              if (error instanceof FieldError) {
                FieldError fieldError = (FieldError) error;
                errorMap.put("field", fieldError.getField());
                errorMap.put("message", fieldError.getDefaultMessage());
              } else {
                errorMap.put("message", error.getDefaultMessage());
              }
              errorList.add(errorMap);
            });

    problemDetail.setProperty("errors", errorList);

    return new ResponseEntity<>(problemDetail, HttpStatus.BAD_REQUEST);
  }
}
