package com.csiro.tickets.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class TicketNumberGenerator {
  @Value("${snomio.ticket.number.prefix}")
  private String prefix;

  @Value("${snomio.ticket.number.digits}")
  private int digits;

  // TODO currently using data base id to generate unique ticket number
  public String generateTicketNumber(Long id) {
    String formattedId = String.format("%0" + digits + "d", id);
    return prefix + "-" + formattedId;
  }
}
