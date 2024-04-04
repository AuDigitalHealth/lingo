package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class TicketStateClosedProblem extends SnomioProblem {

  public TicketStateClosedProblem(String message) {
    super("ticket-state-closed-problem", "Forbidden", HttpStatus.FORBIDDEN, message);
  }
}
