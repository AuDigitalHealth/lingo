package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ErrorMessages;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.models.Comment;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.CommentRepository;
import com.csiro.tickets.repository.TicketRepository;
import java.util.Objects;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CommentController {

  private static final String COMMENT_NOT_FOUND_MESSAGE = "Comment with ID %s not found";
  final TicketRepository ticketRepository;
  final CommentRepository commentRepository;

  @Autowired
  public CommentController(TicketRepository ticketRepository, CommentRepository commentRepository) {
    this.ticketRepository = ticketRepository;
    this.commentRepository = commentRepository;
  }

  @PostMapping(
      value = "/api/tickets/{ticketId}/comments",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Comment> createComment(
      @PathVariable Long ticketId, @RequestBody Comment comment) {

    final Optional<Ticket> optional = ticketRepository.findById(ticketId);
    if (optional.isPresent()) {
      comment.setTicket(optional.get());
      final Comment newComment = commentRepository.save(comment);
      return new ResponseEntity<>(newComment, HttpStatus.OK);
    } else {
      throw new ResourceNotFoundProblem(String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId));
    }
  }

  @DeleteMapping(value = "/api/tickets/{ticketId}/comments/{commentId}")
  public ResponseEntity<Comment> deleteComment(
      @PathVariable Long ticketId, @PathVariable Long commentId) {

    final Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);
    final Optional<Comment> commentOptional = commentRepository.findById(commentId);
    if (ticketOptional.isPresent() && commentOptional.isPresent()) {
      Ticket ticket = ticketOptional.get();
      Comment commentToDelete = commentOptional.get();
      ticket.setComments(
          ticket.getComments().stream()
              .filter(comment -> !Objects.equals(comment.getId(), commentToDelete.getId()))
              .toList());

      ticketRepository.save(ticket);

      return new ResponseEntity<>(HttpStatus.OK);
    } else {
      String message =
          String.format(
              ticketOptional.isPresent()
                  ? COMMENT_NOT_FOUND_MESSAGE
                  : ErrorMessages.TICKET_ID_NOT_FOUND);
      Long id = ticketOptional.isPresent() ? commentId : ticketId;
      throw new ResourceNotFoundProblem(String.format(message, id));
    }
  }
}
