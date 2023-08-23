package com.csiro.snomio.repository;

import com.csiro.snomio.models.tickets.Ticket;
import com.csiro.snomio.models.tickets.TicketType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

  List<Ticket> findByTitle(String title);

  List<Ticket> findByTicketType(TicketType ticketType);
}
