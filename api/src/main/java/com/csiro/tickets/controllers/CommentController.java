package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ErrorMessages;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.CommentDto;
import com.csiro.tickets.models.Comment;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.mappers.CommentMapper;
import com.csiro.tickets.repository.CommentRepository;
import com.csiro.tickets.repository.TicketRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CommentController {

  TicketRepository ticketRepository;
  CommentRepository commentRepository;
  CommentMapper commentMapper;

  @Autowired
  public CommentController(
      TicketRepository ticketRepository,
      CommentRepository commentRepository,
      CommentMapper commentMapper) {
    this.ticketRepository = ticketRepository;
    this.commentRepository = commentRepository;
    this.commentMapper = commentMapper;
  }

  @GetMapping(
      value = "/api/tickets/{ticketId}/comments",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<List<CommentDto>> getComments(@PathVariable Long ticketId) {

    return new ResponseEntity<>(
        commentMapper.toDtoList(commentRepository.findByTicket_Id(ticketId)), HttpStatus.OK);
  }

  @PostMapping(
      value = "/api/tickets/{ticketId}/comments",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<CommentDto> createComment(
      @PathVariable Long ticketId, @RequestBody CommentDto commentDto) {

    final Optional<Ticket> optional = ticketRepository.findById(ticketId);
    Comment comment = new Comment();
    comment.setText(commentDto.getText());
    if (optional.isPresent()) {
      comment.setTicket(optional.get());
      final Comment newComment = commentRepository.save(comment);
      return new ResponseEntity<>(commentMapper.toDto(newComment), HttpStatus.OK);
    } else {
      throw new ResourceNotFoundProblem(String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId));
    }
  }

  @PatchMapping(
      value = "/api/tickets/{ticketId}/comments/{commentId}",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<CommentDto> updateComment(
      @PathVariable Long ticketId,
      @PathVariable Long commentId,
      @RequestBody CommentDto commentDto) {

    Optional<Comment> optionalComment = commentRepository.findById(commentId);

    if (optionalComment.isEmpty()) {
      throw new ResourceNotFoundProblem(
          String.format(ErrorMessages.COMMENT_ID_NOT_FOUND, commentId));
    }

    Comment comment = optionalComment.get();

    if (!comment.getTicket().getId().equals(ticketId)) {
      throw new ResourceNotFoundProblem(
          String.format(ErrorMessages.COMMENT_NOT_FOUND_FOR_TICKET, commentId, ticketId));
    }

    comment.setText(commentDto.getText());
    Comment updatedComment = commentRepository.save(comment);

    return new ResponseEntity<>(commentMapper.toDto(updatedComment), HttpStatus.OK);
  }

  @DeleteMapping(value = "/api/tickets/{ticketId}/comments/{commentId}")
  public ResponseEntity<Void> deleteComment(
      @PathVariable Long ticketId, @PathVariable Long commentId) {

    if (!commentRepository.existsByTicket_IdAndId(ticketId, commentId)) {
      throw new ResourceNotFoundProblem(
          String.format(
              "Comment with id %s is not associated to ticket with id %s", commentId, ticketId));
    }

    commentRepository.deleteById(commentId);

    return new ResponseEntity<>(HttpStatus.NO_CONTENT);
  }
}
