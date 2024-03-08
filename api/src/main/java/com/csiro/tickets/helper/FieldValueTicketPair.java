package com.csiro.tickets.helper;

import lombok.Data;

@Data
public class FieldValueTicketPair {

  private String valueOf;
  private Long ticketId;

  public FieldValueTicketPair(String valueOf, Long ticketId) {
    this.valueOf = valueOf;
    this.ticketId = ticketId;
  }
}
