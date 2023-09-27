package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ErrorMessages;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.models.Comment;
import com.csiro.tickets.models.Iteration;
import com.csiro.tickets.models.PriorityBucket;
import com.csiro.tickets.models.State;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.CommentRepository;
import com.csiro.tickets.repository.IterationRepository;
import com.csiro.tickets.repository.PriorityBucketRepository;
import com.csiro.tickets.repository.StateRepository;
import com.csiro.tickets.repository.TicketRepository;
import com.csiro.tickets.service.TicketService;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.CollectionModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TicketController {

  @Autowired TicketService ticketService;

  @Autowired TicketRepository ticketRepository;

  @Autowired CommentRepository commentRepository;

  @Autowired StateRepository stateRepository;

  @Autowired IterationRepository iterationRepository;

  @Autowired PriorityBucketRepository priorityBucketRepository;

  private static final String COMMENT_NOT_FOUND_MESSAGE = "Comment with ID %s not found";

  private static final String STATE_NOT_FOUND_MESSAGE = "State with ID %s not found";

  @GetMapping("/api/tickets")
  public ResponseEntity<CollectionModel<?>> getAllTickets(
      @RequestParam(defaultValue = "0") final Integer page,
      @RequestParam(defaultValue = "20") final Integer size,
      PagedResourcesAssembler<TicketDto> pagedResourcesAssembler) {
    Pageable pageable = PageRequest.of(page, size);
    final Page<TicketDto> pagedTicketDto = ticketService.findAllTickets(pageable);
    if (page > pagedTicketDto.getTotalPages()) {
      throw new ResourceNotFoundProblem("Page does not exist");
    }

    return new ResponseEntity<>(pagedResourcesAssembler.toModel(pagedTicketDto), HttpStatus.OK);
  }

  @PostMapping(value = "/api/tickets", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<TicketDto> createTicket(@RequestBody TicketDto ticketDto) {
    Ticket ticket = Ticket.of(ticketDto);

    if (ticketDto.getIteration() != null) {
      Optional<Iteration> iterationOptional =
          iterationRepository.findById(ticketDto.getIteration().getId());
      ticket.setIteration(iterationOptional.get());
    }
    if (ticketDto.getPriorityBucket() != null) {
      Optional<PriorityBucket> priorityBucketOptional =
          priorityBucketRepository.findById(ticketDto.getPriorityBucket().getId());
      ticket.setPriorityBucket(priorityBucketOptional.get());
    }

    Ticket createdTicket = ticketRepository.save(ticket);
    TicketDto responseTicket = TicketDto.of(createdTicket);
    return new ResponseEntity<>(responseTicket, HttpStatus.OK);
  }

  @GetMapping("/api/tickets/{ticketId}")
  public ResponseEntity<Ticket> getTicket(@PathVariable Long ticketId) {

    final Optional<Ticket> optional = ticketRepository.findById(ticketId);
    if (optional.isPresent()) {
      Ticket ticket = optional.get();
      return new ResponseEntity<>(ticket, HttpStatus.OK);
    } else {
      throw new ResourceNotFoundProblem(String.format("Ticket with Id %s not found", ticketId));
    }
  }

  @PutMapping(value = "/api/tickets/{ticketId}", consumes = "application/json; charset=utf-8")
  public ResponseEntity<Ticket> updateTicket(
      @PathVariable Long ticketId, @RequestBody TicketDto ticketDto) {

    Ticket ticket = ticketService.updateTicket(ticketId, ticketDto);
    return new ResponseEntity<>(ticket, HttpStatus.OK);
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
      commentRepository.delete(commentOptional.get());
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

  @PutMapping(
      value = "/api/tickets/{ticketId}/state/{stateId}",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<TicketDto> updateTicketState(
      @PathVariable Long ticketId, @PathVariable Long stateId) {
    Optional<State> stateOptional = stateRepository.findById(stateId);
    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);
    if (ticketOptional.isPresent() && stateOptional.isPresent()) {
      Ticket ticket = ticketOptional.get();
      State state = stateOptional.get();
      ticket.setState(state);
      Ticket updatedTicket = ticketRepository.save(ticket);
      return new ResponseEntity<>(TicketDto.of(updatedTicket), HttpStatus.OK);
    } else {
      String message =
          String.format(
              ticketOptional.isPresent()
                  ? STATE_NOT_FOUND_MESSAGE
                  : ErrorMessages.TICKET_ID_NOT_FOUND);
      Long id = ticketOptional.isPresent() ? stateId : ticketId;
      throw new ResourceNotFoundProblem(String.format(message, id));
    }
  }

  @PutMapping(
      value = "/api/tickets/{ticketId}/assignee/{assignee}",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<TicketDto> updateAssignee(
      @PathVariable Long ticketId, @PathVariable String assignee) {
    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);
    // need to check if the assignee exists, user table..
    if (ticketOptional.isPresent()) {
      Ticket ticket = ticketOptional.get();
      ticket.setAssignee(assignee);
      Ticket updatedTicket = ticketRepository.save(ticket);
      return new ResponseEntity<>(TicketDto.of(updatedTicket), HttpStatus.OK);
    } else {
      throw new ResourceNotFoundProblem(String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId));
    }
  }

  @PutMapping(
      value = "/api/tickets/{ticketId}/iteration/{iterationId}",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<TicketDto> updateIteration(
      @PathVariable Long ticketId, @PathVariable Long iterationId) {
    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);
    Optional<Iteration> iterationOption = iterationRepository.findById(iterationId);

    if (ticketOptional.isPresent() && iterationOption.isPresent()) {
      Ticket ticket = ticketOptional.get();
      Iteration iteration = iterationOption.get();
      ticket.setIteration(iteration);
      Ticket updatedTicket = ticketRepository.save(ticket);
      return new ResponseEntity<>(TicketDto.of(updatedTicket), HttpStatus.OK);
    } else {
      String message =
          String.format(
              ticketOptional.isPresent()
                  ? STATE_NOT_FOUND_MESSAGE
                  : ErrorMessages.TICKET_ID_NOT_FOUND);
      Long id = ticketOptional.isPresent() ? iterationId : ticketId;
      throw new ResourceNotFoundProblem(String.format(message, id));
    }
  }

  @PutMapping(
      value = "/api/tickets/{ticketId}/priorityBucket/{priorityBucketId}",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<TicketDto> updatePriorityBucket(
      @PathVariable Long ticketId, @PathVariable Long priorityBucketId) {
    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);
    Optional<PriorityBucket> priorityBucketOptional =
        priorityBucketRepository.findById(priorityBucketId);

    if (ticketOptional.isPresent() && priorityBucketOptional.isPresent()) {
      Ticket ticket = ticketOptional.get();
      PriorityBucket priorityBucket = priorityBucketOptional.get();
      ticket.setPriorityBucket(priorityBucket);
      Ticket updatedTicket = ticketRepository.save(ticket);
      return new ResponseEntity<>(TicketDto.of(updatedTicket), HttpStatus.OK);
    } else {
      String message =
          String.format(
              ticketOptional.isPresent()
                  ? ErrorMessages.PRIORITY_BUCKET_ID_NOT_FOUND
                  : ErrorMessages.TICKET_ID_NOT_FOUND);
      Long id = ticketOptional.isPresent() ? priorityBucketId : ticketId;
      throw new ResourceNotFoundProblem(String.format(message, id));
    }
  }
}
