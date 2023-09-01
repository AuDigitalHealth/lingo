package com.csiro.tickets.service;

import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.controllers.exceptions.ResourceNotFoundProblem;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.TicketRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class TicketService {

  @Autowired TicketRepository ticketRepository;

  public List<TicketDto> findAllTickets() {
    List<TicketDto> tickets = new ArrayList<>();

    ticketRepository.findAll().forEach(ticket -> tickets.add(TicketDto.of(ticket)));

    return tickets;
  }

  public Ticket updateTicket(Long ticketId, TicketDto ticketDto) {
    Optional<Ticket> optional = ticketRepository.findById(ticketId);

    if (optional.isPresent()) {
      Ticket ticket = optional.get();
      ticket.setTitle(ticketDto.getTitle());
      ticket.setDescription(ticketDto.getDescription());
      ticket.setModified(Instant.now());
      return ticketRepository.save(ticket);
    } else {
      throw new ResourceNotFoundProblem(String.format("Ticket not found with id %s", ticketId));
    }
  }
}
