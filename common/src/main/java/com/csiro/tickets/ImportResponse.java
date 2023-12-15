package com.csiro.tickets;

import lombok.Builder;
import lombok.Value;
import org.springframework.http.HttpStatus;

@Value
@Builder
public class ImportResponse {

  private String message;

  private HttpStatus status;
}
