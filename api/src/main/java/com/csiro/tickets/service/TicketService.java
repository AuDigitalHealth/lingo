package com.csiro.tickets.service;

import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.TicketRepository;
import com.querydsl.core.types.Predicate;
import java.time.Instant;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

@Component
public class TicketService {

  final TicketRepository ticketRepository;

  @Autowired
  public TicketService(TicketRepository ticketRepository) {
    this.ticketRepository = ticketRepository;
  }

  public Page<TicketDto> findAllTickets(Pageable pageable) {
    Page<Ticket> tickets = ticketRepository.findAll(pageable);
    return tickets.map(ticket -> TicketDto.of(ticket));
  }

  public Page<TicketDto> findAllTicketsByQueryParam(Predicate predicate, Pageable pageable) {
    Page<Ticket> tickets = ticketRepository.findAll(predicate, pageable);
    Page<TicketDto> ticketDtos = tickets.map(ticket -> TicketDto.of(ticket));

    return ticketDtos;
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
