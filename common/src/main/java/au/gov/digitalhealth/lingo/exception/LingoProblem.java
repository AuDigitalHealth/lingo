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

import java.io.Serial;
import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

@SuppressWarnings("java:S110")
public class LingoProblem extends ErrorResponseException {

  public static final String BASE_PROBLEM_TYPE_URI = "http://lingo.csiro.au/problem/";
  public static final String URI_SUB_PATH = "lingo-problem";
  public static final String GENERIC_TITLE = "Error";
  @Serial private static final long serialVersionUID = 1L;

  public LingoProblem(
      String uriSubPath, String title, HttpStatus status, String detail, Throwable e) {
    super(status, asProblemDetail(uriSubPath, status, title, detail), e);
  }

  public LingoProblem(String uriSubPath, String title, HttpStatus status, String detail) {
    this(uriSubPath, title, status, detail, null);
  }

  public LingoProblem(String uriSubPath, String title, HttpStatus status, Throwable e) {
    this(uriSubPath, title, status, null, e);
  }

  public LingoProblem(String uriSubPath, String title, HttpStatus status) {
    this(uriSubPath, title, status, null, null);
  }

  public LingoProblem(String message, Throwable e) {
    this(URI_SUB_PATH, GENERIC_TITLE, HttpStatus.INTERNAL_SERVER_ERROR, message, e);
  }

  public LingoProblem(String message) {
    this(URI_SUB_PATH, GENERIC_TITLE, HttpStatus.INTERNAL_SERVER_ERROR, message);
  }

  public LingoProblem() {
    this(URI_SUB_PATH, GENERIC_TITLE, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  protected static URI toTypeUri(String subtype) {
    return URI.create(BASE_PROBLEM_TYPE_URI + subtype);
  }

  protected static ProblemDetail asProblemDetail(
      String uriSubPath, HttpStatus status, String title, String detail) {
    ProblemDetail problemDetail = ProblemDetail.forStatus(status);
    problemDetail.setTitle(title);
    problemDetail.setType(toTypeUri(uriSubPath));
    problemDetail.setDetail(detail);
    return problemDetail;
  }
}
