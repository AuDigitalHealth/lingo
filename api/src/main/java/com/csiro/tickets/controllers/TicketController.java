package com.csiro.tickets.controllers;

import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.controllers.exceptions.ResourceNotFoundException;
import com.csiro.tickets.models.Comment;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.CommentRepository;
import com.csiro.tickets.repository.TicketRepository;
import com.csiro.tickets.service.TicketService;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
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

  @Autowired CommentRepository commentRepository;

  private static final String TICKET_NOT_FOUND_MESSAGE = "Ticket with ID %s not found";

  private static final String COMMENT_NOT_FOUND_MESSAGE = "Comment with ID %s not found";

  @GetMapping("/api/ticket")
  public ResponseEntity<List<TicketDto>> getAllTickets() {

    final List<TicketDto> tickets = ticketService.findAllTickets();
    return new ResponseEntity<>(tickets, HttpStatus.OK);
  }

  @PostMapping(value = "api/ticket", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<TicketDto> createTicket(@RequestBody TicketDto ticketDto) {
    Ticket ticket = Ticket.of(ticketDto);
    Ticket createdTicket = ticketRepository.save(ticket);
    TicketDto responseTicket = TicketDto.of(createdTicket);
    return new ResponseEntity<>(responseTicket, HttpStatus.OK);
  }

  @GetMapping("/api/ticket/{ticketId}")
  public ResponseEntity<Ticket> getTicket(@PathVariable Long ticketId) {

    final Optional<Ticket> optional = ticketRepository.findById(ticketId);
    if (optional.isPresent()) {
      Ticket ticket = optional.get();
      return new ResponseEntity<>(ticket, HttpStatus.OK);
    } else {
      throw new ResourceNotFoundException(String.format(TICKET_NOT_FOUND_MESSAGE, ticketId));
    }
  }

  @PutMapping(value = "/api/ticket/{ticketId}", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Ticket> updateTicket(
      @PathVariable Long ticketId, @RequestBody TicketDto ticketDto) {

    Ticket ticket = ticketService.updateTicket(ticketId, ticketDto);
    return new ResponseEntity<>(ticket, HttpStatus.OK);
  }

  @PostMapping(
      value = "/api/ticket/{ticketId}/comments",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Comment> createComment(
      @PathVariable Long ticketId, @RequestBody Comment comment) {

    final Optional<Ticket> optional = ticketRepository.findById(ticketId);
    if (optional.isPresent()) {
      comment.setTicket(optional.get());
      final Comment newComment = commentRepository.save(comment);
      return new ResponseEntity<>(newComment, HttpStatus.OK);
    } else {
      throw new ResourceNotFoundException(String.format(TICKET_NOT_FOUND_MESSAGE, ticketId));
    }
  }

  @DeleteMapping(
      value = "/api/ticket/{ticketId}/comments/{commentId}",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Comment> deleteComment(
      @PathVariable Long ticketId, @PathVariable Long commentId) {

    final Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);
    final Optional<Comment> commentOptional = commentRepository.findById(commentId);
    if (ticketOptional.isPresent() && commentOptional.isPresent()) {
      commentRepository.delete(commentOptional.get());
      return new ResponseEntity<>(HttpStatus.OK);
    } else {
      String message =
          String.format(
              ticketOptional.isPresent() ? COMMENT_NOT_FOUND_MESSAGE : TICKET_NOT_FOUND_MESSAGE);
      Long id = ticketOptional.isPresent() ? commentId : ticketId;
      throw new ResourceNotFoundException(String.format(message, id));
    }
  }
}
