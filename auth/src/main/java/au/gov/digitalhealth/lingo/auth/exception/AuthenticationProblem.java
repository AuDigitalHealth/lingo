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
package au.gov.digitalhealth.lingo.auth.exception;

import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

public class AuthenticationProblem extends ErrorResponseException {
  public static final String BASE_PROBLEM_TYPE_URI = "http://lingo.csiro.au/problem/access-denied";

  public AuthenticationProblem(String message) {
    this("", "Forbidden", HttpStatus.FORBIDDEN, message);
  }

  private AuthenticationProblem(String uriSubPath, String title, HttpStatus status, String detail) {
    super(status, asProblemDetail(uriSubPath, status, title, detail), null);
  }

  private static URI toTypeUri(String subtype) {
    return URI.create(BASE_PROBLEM_TYPE_URI + subtype);
  }

  private static ProblemDetail asProblemDetail(
      String uriSubPath, HttpStatus status, String title, String detail) {
    ProblemDetail problemDetail = ProblemDetail.forStatus(status);
    problemDetail.setTitle(title);
    problemDetail.setType(toTypeUri(uriSubPath));
    problemDetail.setDetail(detail);
    return problemDetail;
  }
}
