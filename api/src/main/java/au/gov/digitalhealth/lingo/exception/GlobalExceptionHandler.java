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
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

  public static final String MESSAGE = "message";
  public static final String FIELD = "field";
  public static final String ERRORS = "errors";
  public static final String ERROR = "error";
  public static final String PATH = "path";
  public static final String CAUSE = "cause";

  public static final String UPSTREAM_SERVICE = "upstream_service";
  public static final String UPSTREAM_STATUS = "upstream_status";

  @ExceptionHandler(AuthenticationProblem.class)
  ProblemDetail handleAuthenticationProblem(AuthenticationProblem e) {
    return e.getBody();
  }

  @ExceptionHandler({
    WebClientResponseException.InternalServerError.class,
    WebClientResponseException.BadGateway.class
  })
  ResponseEntity<ProblemDetail> handleUpstreamServiceError(WebClientResponseException ex) {
    String upstreamService = extractServiceName(ex.getRequest());
    UpstreamServiceProblem problem =
        new UpstreamServiceProblem(
            "Upstream service error: " + ex.getMessage(),
            upstreamService,
            HttpStatus.resolve(ex.getStatusCode().value()),
            ex);
    return new ResponseEntity<>(problem.getBody(), ex.getStatusCode());
  }

  private String extractServiceName(org.springframework.http.HttpRequest request) {
    if (request != null && request.getURI() != null) {
      String host = request.getURI().getHost();
      if (host != null) {
        // Extract service name from hostname (customize based on your naming conventions)
        if (host.contains("authoring-services")) {
          return "Authoring Platform API";
        } else if (host.contains("snowstorm")) {
          return "Snowstorm";
        }
        // Add more service mappings as needed
        return host;
      }
    }
    return "Unknown Upstream Service";
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
            error -> {
              Map<String, String> errorMap = new HashMap<>();
              if (error instanceof FieldError fieldError) {
                errorMap.put(FIELD, fieldError.getField());
                errorMap.put(MESSAGE, fieldError.getDefaultMessage());
              } else {
                errorMap.put(MESSAGE, error.getDefaultMessage());
              }
              errorList.add(errorMap);
            });

    problemDetail.setProperty(ERRORS, errorList);

    return new ResponseEntity<>(problemDetail, HttpStatus.BAD_REQUEST);
  }

  @Override
  protected ResponseEntity<Object> handleHttpMessageNotReadable(
      HttpMessageNotReadableException ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {

    Map<String, Object> errorDetails = new HashMap<>();
    errorDetails.put(ERROR, "Malformed JSON request");
    errorDetails.put(MESSAGE, ex.getMessage());

    // Extract path information from request if available
    if (request instanceof ServletWebRequest servletRequest) {
      errorDetails.put(PATH, servletRequest.getRequest().getRequestURI());
    }

    Throwable cause = ex.getCause();
    if (cause != null) {
      errorDetails.put(CAUSE, cause.getMessage());
    }

    return new ResponseEntity<>(errorDetails, HttpStatus.BAD_REQUEST);
  }
}
