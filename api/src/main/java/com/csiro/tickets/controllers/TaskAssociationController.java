package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ErrorMessages;
import com.csiro.snomio.exception.ResourceAlreadyExists;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.controllers.dto.TaskAssociationDto;
import com.csiro.tickets.models.TaskAssociation;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.TaskAssociationRepository;
import com.csiro.tickets.repository.TicketRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TaskAssociationController {

  @Autowired TaskAssociationRepository taskAssociationRepository;

  @Autowired TicketRepository ticketRepository;

  @GetMapping("/api/tickets/taskAssociations")
  public ResponseEntity<List<TaskAssociationDto>> getAllTicketAssociations() {
    List<TaskAssociationDto> taskAssociations = taskAssociationRepository.findAllToDto();
    return new ResponseEntity<>(taskAssociations, HttpStatus.OK);
  }

  @PostMapping("/api/tickets/{ticketId}/taskAssociations/{taskId}")
  public ResponseEntity<TaskAssociation> createTaskAssociation(
      @PathVariable Long ticketId, @PathVariable String taskId) {
    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);
    Optional<TaskAssociation> existingTaskAssociation = taskAssociationRepository.findExisting(taskId, ticketId);
    if(existingTaskAssociation.isPresent()) throw new ResourceAlreadyExists(ErrorMessages.TASK_ASSOCIATION_ALREADY_EXISTS);
    if (ticketOptional.isPresent()) {
      TaskAssociation taskAssociation = new TaskAssociation();
      taskAssociation.setTaskId(taskId);
      taskAssociation.setTicket(ticketOptional.get());
      TaskAssociation savedTaskAssociation = taskAssociationRepository.save(taskAssociation);
      return new ResponseEntity<>(savedTaskAssociation, HttpStatus.OK);
    } else {
      throw new ResourceNotFoundProblem(String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId));
    }
  }

  @DeleteMapping("/api/tickets/taskAssociations/{taskAssociationId}")
  public ResponseEntity<TaskAssociation> deleteTaskAssociation(
      @PathVariable Long taskAssociationId) {
    Optional<TaskAssociation> existingTaskAssociation = taskAssociationRepository.findById(taskAssociationId);
    if(!existingTaskAssociation.isPresent()) throw new ResourceNotFoundProblem(ErrorMessages.TASK_ASSOCIATION_ID_NOT_FOUND);
      taskAssociationRepository.delete(existingTaskAssociation.get());
      return new ResponseEntity<>(HttpStatus.NO_CONTENT);

  }

  @DeleteMapping("/api/tickets/{ticketId}/taskAssociations/{taskAssociationId}")
  public ResponseEntity<TaskAssociation> deleteTaskAssociation(
      @PathVariable Long ticketId, @PathVariable Long taskAssociationId) {
    final Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);
    if (!ticketOptional.isPresent())
      throw new ResourceNotFoundProblem(String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId));

    Optional<TaskAssociation> taskAssociationOptional =
        taskAssociationRepository.findById(taskAssociationId);
    if (!taskAssociationOptional.isPresent())
      throw new ResourceNotFoundProblem(
          String.format(ErrorMessages.TASK_ASSOCIATION_ID_NOT_FOUND, taskAssociationId));

    taskAssociationRepository.delete(taskAssociationOptional.get());
    return new ResponseEntity<>(HttpStatus.OK);
  }
}
