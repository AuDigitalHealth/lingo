package com.csiro.tickets.helper;

import com.csiro.tickets.models.Label;
import com.csiro.tickets.models.Ticket;

public class TicketUtils {

  public static final String DUPLICATE_LABEL_NAME = "Duplicate";

  private TicketUtils() {}

  public static boolean isTicketDuplicate(Ticket ticket) {
    for (Label label : ticket.getLabels()) {
      if (DUPLICATE_LABEL_NAME.equals(label.getName())) {
        return true;
      }
    }
    return false;
  }
}
