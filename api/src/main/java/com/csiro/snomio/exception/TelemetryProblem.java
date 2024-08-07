package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class TelemetryProblem extends SnomioProblem {
  public TelemetryProblem(String message) {
    super(
        "telemetry-problem",
        "Failed to parse and enrich telemetry data",
        HttpStatus.SERVICE_UNAVAILABLE,
        message);
  }
}
