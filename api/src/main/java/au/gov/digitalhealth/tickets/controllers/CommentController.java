/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.tickets.controllers;

import au.gov.digitalhealth.lingo.exception.ErrorMessages;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.CommentDto;
import au.gov.digitalhealth.tickets.models.Comment;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.models.mappers.CommentMapper;
import au.gov.digitalhealth.tickets.repository.CommentRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
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
