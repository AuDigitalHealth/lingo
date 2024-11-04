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
import au.gov.digitalhealth.lingo.exception.ResourceAlreadyExists;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.TaskAssociationDto;
import au.gov.digitalhealth.tickets.models.TaskAssociation;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.repository.TaskAssociationRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TaskAssociationController {

  TaskAssociationRepository taskAssociationRepository;

  TicketRepository ticketRepository;

  public TaskAssociationController(
      TaskAssociationRepository taskAssociationRepository, TicketRepository ticketRepository) {
    this.taskAssociationRepository = taskAssociationRepository;
    this.ticketRepository = ticketRepository;
  }

  @GetMapping("/api/tickets/taskAssociations")
  public ResponseEntity<List<TaskAssociationDto>> getAllTicketAssociations() {
    List<TaskAssociationDto> taskAssociations = taskAssociationRepository.findAllToDto();
    return new ResponseEntity<>(taskAssociations, HttpStatus.OK);
  }

  @PostMapping("/api/tickets/{ticketId}/taskAssociations/{taskId}")
  public ResponseEntity<TaskAssociation> createTaskAssociation(
      @PathVariable Long ticketId, @PathVariable String taskId) {
    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);
    Optional<TaskAssociation> existingTaskAssociation =
        taskAssociationRepository.findExisting(ticketId);
    if (existingTaskAssociation.isPresent())
      throw new ResourceAlreadyExists(
          String.format(ErrorMessages.TASK_ASSOCIATION_ALREADY_EXISTS, ticketId));
    if (ticketOptional.isPresent()) {
      Ticket ticket = ticketOptional.get();
      TaskAssociation taskAssociation = new TaskAssociation();
      taskAssociation.setTaskId(taskId);
      taskAssociation.setTicket(ticket);
      taskAssociationRepository.save(taskAssociation);
      ticket.setTaskAssociation(taskAssociation);
      ticketRepository.save(ticket);
      TaskAssociation savedTaskAssociation = ticket.getTaskAssociation();
      return new ResponseEntity<>(savedTaskAssociation, HttpStatus.OK);
    } else {
      throw new ResourceNotFoundProblem(String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId));
    }
  }

  @DeleteMapping("/api/tickets/{ticketId}/taskAssociations/{taskAssociationId}")
  public ResponseEntity<TaskAssociation> deleteTaskAssociation(
      @PathVariable Long ticketId, @PathVariable Long taskAssociationId) {
    final Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);
    if (ticketOptional.isEmpty())
      throw new ResourceNotFoundProblem(String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId));

    Optional<TaskAssociation> taskAssociationOptional =
        taskAssociationRepository.findById(taskAssociationId);

    if (taskAssociationOptional.isEmpty())
      throw new ResourceNotFoundProblem(
          String.format(ErrorMessages.TASK_ASSOCIATION_ID_NOT_FOUND, taskAssociationId));

    Ticket ticket = ticketOptional.get();
    ticket.setTaskAssociation(null);

    ticketRepository.save(ticket);

    taskAssociationRepository.delete(taskAssociationOptional.get());

    return new ResponseEntity<>(HttpStatus.NO_CONTENT);
  }
}
