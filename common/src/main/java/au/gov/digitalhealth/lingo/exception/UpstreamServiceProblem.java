package au.gov.digitalhealth.lingo.exception;

import org.springframework.http.HttpStatus;

public class UpstreamServiceProblem extends LingoProblem {

  public UpstreamServiceProblem(String message, String upstreamService, HttpStatus upstreamStatus) {
    super(
        "upstream-service-error",
        "Upstream Service Error",
        upstreamStatus,
        message + " from " + upstreamService);
  }

  public UpstreamServiceProblem(
      String message, String upstreamService, HttpStatus upstreamStatus, Throwable cause) {
    super(
        "upstream-service-error",
        "Upstream Service Error",
        upstreamStatus,
        message + " from " + upstreamService,
        cause);
  }
}
