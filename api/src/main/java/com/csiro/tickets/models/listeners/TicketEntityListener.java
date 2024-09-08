package com.csiro.tickets.models.listeners;

import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.service.TicketNumberGenerator;
import jakarta.persistence.PostPersist;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class TicketEntityListener {

  private static TicketNumberGenerator ticketNumberGenerator;

  @Autowired
  public void setTicketNumberGenerator(TicketNumberGenerator ticketNumberGenerator) {
    TicketEntityListener.ticketNumberGenerator = ticketNumberGenerator;
  }

  @PostPersist
  public void setTicketNumber(Ticket ticket) {
    String ticketNumber = ticketNumberGenerator.generateTicketNumber(ticket.getId());
    ticket.setTicketNumber(ticketNumber);
  }
}
