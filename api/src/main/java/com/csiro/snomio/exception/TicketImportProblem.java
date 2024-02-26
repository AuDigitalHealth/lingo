package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class TicketImportProblem extends SnomioProblem {
  public TicketImportProblem(String message) {
    super("ticket-import-problem", "Ticket Import Failure", HttpStatus.NOT_FOUND, message);
  }

  public TicketImportProblem() {
    super("ticket-import-problem", "Ticket Import Failure", HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
