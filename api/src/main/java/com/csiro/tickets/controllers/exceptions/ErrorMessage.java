package com.csiro.tickets.controllers.exceptions;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ErrorMessage {
  private int statusCode;
  private Instant timestamp;
  private String message;
  private String description;
}
