package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ErrorMessages;
import com.csiro.snomio.exception.ResourceAlreadyExists;
import com.csiro.snomio.exception.ResourceInUseProblem;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.models.ExternalRequestor;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.ExternalRequestorRepository;
import com.csiro.tickets.repository.TicketRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class ExternalRequestorController {

  private final ExternalRequestorRepository externalRequestorRepository;
  private final TicketRepository ticketRepository;

  @Autowired
  public ExternalRequestorController(
      ExternalRequestorRepository externalRequestorRepository, TicketRepository ticketRepository) {
    this.externalRequestorRepository = externalRequestorRepository;
    this.ticketRepository = ticketRepository;
  }

  @GetMapping("/api/tickets/externalRequestors")
  public ResponseEntity<List<ExternalRequestor>> getAllExternalRequestors() {
    List<ExternalRequestor> externalRequestors = externalRequestorRepository.findAll();

    return new ResponseEntity<>(externalRequestors, HttpStatus.OK);
  }

  @PostMapping(
      value = "/api/tickets/externalRequestors",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<ExternalRequestor> createExternalRequestor(
      @RequestBody ExternalRequestor externalRequestor) {

    String externalRequestorName = externalRequestor.getName();
    Optional<ExternalRequestor> externalRequestorOptional =
        externalRequestorRepository.findByName(externalRequestorName);

    if (externalRequestorOptional.isPresent()) {
      throw new ResourceAlreadyExists(
          String.format("External Requestor with name %s already exists", externalRequestorName));
    }
    ExternalRequestor createdExternalRequestor =
        externalRequestorRepository.save(externalRequestor);

    return new ResponseEntity<>(createdExternalRequestor, HttpStatus.OK);
  }

  @PutMapping(
      value = "/api/tickets/externalRequestors/{externalRequestorId}",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<ExternalRequestor> updateExternalRequestor(
      @PathVariable Long externalRequestorId, @RequestBody ExternalRequestor externalRequestor) {
    ExternalRequestor foundExternalRequestor =
        externalRequestorRepository
            .findById(externalRequestorId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(
                            "External requestor with id %s not found", externalRequestorId)));

    foundExternalRequestor.setName(externalRequestor.getName());
    foundExternalRequestor.setDescription(externalRequestor.getDescription());
    foundExternalRequestor.setDisplayColor(externalRequestor.getDisplayColor());

    ExternalRequestor updatedExternalRequestor =
        externalRequestorRepository.save(foundExternalRequestor);

    return new ResponseEntity<>(updatedExternalRequestor, HttpStatus.OK);
  }

  @DeleteMapping(value = "/api/tickets/externalRequestors/{externalRequestorId}")
  public ResponseEntity deleteExternalRequestor(@PathVariable Long externalRequestorId) {
    ExternalRequestor foundExternalRequestor =
        externalRequestorRepository
            .findById(externalRequestorId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(
                            "External requestor with id %s not found", externalRequestorId)));
    List<Ticket> tickets = ticketRepository.findAllByExternalRequestors(foundExternalRequestor);
    if (!tickets.isEmpty()) {
      throw new ResourceInUseProblem(
          String.format(
              "External Requestor with ID %s is mapped to tickets and can't be deleted",
              externalRequestorId));
    }
    externalRequestorRepository.deleteById(externalRequestorId);
    return ResponseEntity.noContent().build();
  }

  @PostMapping(value = "/api/tickets/{ticketId}/externalRequestors/{externalRequestorId}")
  public ResponseEntity<ExternalRequestor> createExternalRequestor(
      @PathVariable Long externalRequestorId, @PathVariable Long ticketId) {
    ExternalRequestor externalRequestor =
        externalRequestorRepository
            .findById(externalRequestorId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(
                            ErrorMessages.EXTERNAL_REQUESTOR_ID_NOT_FOUND, externalRequestorId)));
    Ticket ticket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format("Ticket with ID %s not found", ticketId)));

    if (ticket.getExternalRequestors().contains(externalRequestor)) {
      throw new ResourceAlreadyExists(
          String.format("External requestor already associated with Ticket Id %s", ticketId));
    }
    ticket.getExternalRequestors().add(externalRequestor);
    ticketRepository.save(ticket);
    return new ResponseEntity<>(externalRequestor, HttpStatus.OK);
  }

  @DeleteMapping("/api/tickets/{ticketId}/externalRequestors/{externalRequestorId}")
  public ResponseEntity<ExternalRequestor> deleteLabel(
      @PathVariable Long ticketId, @PathVariable Long externalRequestorId) {
    Optional<ExternalRequestor> externalRequestorOptional =
        externalRequestorRepository.findById(externalRequestorId);
    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);

    if (externalRequestorOptional.isPresent() && ticketOptional.isPresent()) {
      Ticket ticket = ticketOptional.get();
      ExternalRequestor externalRequestor = externalRequestorOptional.get();
      if (ticket.getExternalRequestors().contains(externalRequestor)) {
        ticket.getExternalRequestors().remove(externalRequestor);
        ticketRepository.save(ticket);
        return new ResponseEntity<>(externalRequestor, HttpStatus.OK);
      } else {
        throw new ResourceAlreadyExists(
            String.format("External requestor already not associated with Ticket Id %s", ticketId));
      }
    } else {
      String message = externalRequestorOptional.isPresent() ? "Ticket" : "Label";
      Long id = externalRequestorOptional.isPresent() ? ticketId : externalRequestorId;
      throw new ResourceNotFoundProblem(String.format("%s with ID %s not found", message, id));
    }
  }
}
