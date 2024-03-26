package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ErrorMessages;
import com.csiro.snomio.exception.ResourceAlreadyExists;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.TicketAssociationDto;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketAssociation;
import com.csiro.tickets.repository.TicketAssociationRepository;
import com.csiro.tickets.repository.TicketRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets/ticketAssociation")
public class TicketAssociationController {

  @Autowired TicketRepository ticketRepository;

  @Autowired TicketAssociationRepository ticketAssociationRepository;

  @PostMapping("sourceTicket/{sourceId}/targetTicket/{targetId}")
  public ResponseEntity<TicketAssociation> createTicketAssociation(
      @PathVariable Long sourceId,
      @PathVariable Long targetId,
      @RequestBody TicketAssociationDto ticketAssociationDto) {
    Ticket sourceTicket =
        ticketRepository
            .findById(sourceId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, sourceId)));

    Ticket targetTicket =
        ticketRepository
            .findById(targetId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, targetId)));

    List<TicketAssociation> existingAssociation =
        ticketAssociationRepository.findBySourceAndTargetFlipped(sourceTicket, targetTicket);
    if (existingAssociation.size() > 0) {
      throw new ResourceAlreadyExists(
          String.format(
              ErrorMessages.TICKET_ASSOCIATION_EXISTS, sourceTicket.getId(), targetTicket.getId()));
    }

    TicketAssociation ticketAssociation =
        TicketAssociation.builder()
            .associationSource(sourceTicket)
            .associationTarget(targetTicket)
            .description(ticketAssociationDto.getDescription())
            .build();

    TicketAssociation savedAssociation = ticketAssociationRepository.save(ticketAssociation);

    return new ResponseEntity<>(savedAssociation, HttpStatus.CREATED);
  }

  @DeleteMapping("{id}")
  public ResponseEntity<HttpStatus> deleteTicketAssociation(@PathVariable Long id) {
    TicketAssociation ticketAssociation =
        ticketAssociationRepository
            .findById(id)
            .orElseThrow(
                () -> new ResourceNotFoundProblem(String.format(ErrorMessages.ID_NOT_FOUND, id)));

    ticketAssociation.setAssociationSource(null);
    ticketAssociation.setAssociationTarget(null);

    ticketAssociationRepository.save(ticketAssociation);
    ticketAssociationRepository.delete(ticketAssociation);

    return new ResponseEntity<>(HttpStatus.NO_CONTENT);
  }
}
