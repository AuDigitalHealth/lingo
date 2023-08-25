package com.csiro.tickets.controllers;

import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.controllers.exceptions.ResourceNotFoundException;
import com.csiro.tickets.models.Comment;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.CommentRepository;
import com.csiro.tickets.repository.TicketRepository;
import com.csiro.tickets.service.TicketService;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TicketController {

  @Autowired TicketService ticketService;

  @Autowired TicketRepository ticketRepository;

  @Autowired
  CommentRepository commentRepository;

  @GetMapping("/api/ticket")
  public ResponseEntity<List<TicketDto>> getAllTickets() {

    final List<TicketDto> tickets = ticketService.findAllTickets();
    return new ResponseEntity<>(tickets, HttpStatus.OK);
  }

  @GetMapping("/api/ticket/{ticketId}")
  public ResponseEntity<Ticket> getTicket(@PathVariable Long ticketId) {

    final Optional<Ticket> optional = ticketRepository.findById(ticketId);
    if (optional.isPresent()) {
      Ticket ticket = optional.get();
      return new ResponseEntity<>(ticket, HttpStatus.OK);
    } else {
      throw new ResourceNotFoundException(String.format("Ticket with Id %s not found", ticketId));
    }
  }

  @PutMapping(value = "/api/ticket/{ticketId}", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Ticket> updateTicket(
      @PathVariable Long ticketId, @RequestBody TicketDto ticketDto) {

    Ticket ticket = ticketService.updateTicket(ticketId, ticketDto);
    return new ResponseEntity<>(ticket, HttpStatus.OK);
  }

  @PostMapping(value = "/api/ticket/{ticketId}/comments", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Comment> createComment(
      @PathVariable Long ticketId, @RequestBody Comment comment) {

    final Optional<Ticket> optional = ticketRepository.findById(ticketId);
    if(optional.isPresent()){
      comment.setTicket(optional.get());
      final Comment newComment = commentRepository.save(comment);
      return new ResponseEntity<>(newComment, HttpStatus.OK);
    } else {
      throw new ResourceNotFoundException(String.format("Ticket with Id %s not found", ticketId));
    }
  }
}
