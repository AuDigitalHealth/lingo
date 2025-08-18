package au.gov.digitalhealth.lingo.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

public class UpstreamServiceProblem extends LingoProblem {

  public UpstreamServiceProblem(String message, String upstreamService, HttpStatus upstreamStatus) {
    super(
        "upstream-service-error",
        "Upstream Service Error",
        upstreamStatus,
        message + " from " + upstreamService);
  }

  public UpstreamServiceProblem(String message, String upstreamService, HttpStatus upstreamStatus, Throwable cause) {
    super(
        "upstream-service-error",
        "Upstream Service Error",
        upstreamStatus,
        message + " from " + upstreamService,
        cause);
  }
}