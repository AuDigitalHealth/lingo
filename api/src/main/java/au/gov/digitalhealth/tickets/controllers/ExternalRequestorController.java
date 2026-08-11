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
import au.gov.digitalhealth.lingo.exception.ResourceInUseProblem;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.ExternalRequesterDto;
import au.gov.digitalhealth.tickets.models.ExternalRequestor;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.models.TicketExternalRequestor;
import au.gov.digitalhealth.tickets.repository.ExternalRequestorRepository;
import au.gov.digitalhealth.tickets.repository.TicketExternalRequestorRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import jakarta.annotation.Nullable;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class ExternalRequestorController {

  record AddExternalRequestorToTicketRequest(@Nullable LocalDate dateRequested) {}

  private final ExternalRequestorRepository externalRequestorRepository;
  private final TicketRepository ticketRepository;
  private final TicketExternalRequestorRepository ticketExternalRequestorRepository;

  public ExternalRequestorController(
      ExternalRequestorRepository externalRequestorRepository,
      TicketRepository ticketRepository,
      TicketExternalRequestorRepository ticketExternalRequestorRepository) {
    this.externalRequestorRepository = externalRequestorRepository;
    this.ticketRepository = ticketRepository;
    this.ticketExternalRequestorRepository = ticketExternalRequestorRepository;
  }

  @GetMapping("/api/tickets/externalRequestors")
  public ResponseEntity<List<ExternalRequestor>> getAllExternalRequestors() {
    List<ExternalRequestor> externalRequestors = externalRequestorRepository.findAll();

    return new ResponseEntity<>(externalRequestors, HttpStatus.OK);
  }

  @GetMapping("/api/tickets/externalRequestors/search")
  public ResponseEntity<ExternalRequestor> getExternalRequestorByName(@RequestParam String name) {
    return externalRequestorRepository
        .findByName(name)
        .map(er -> new ResponseEntity<>(er, HttpStatus.OK))
        .orElseThrow(
            () ->
                new ResourceNotFoundProblem(
                    String.format("External Requestor with name %s not found", name)));
  }

  @PostMapping(
      value = "/api/tickets/externalRequestors",
      consumes = "application/json",
      produces = "application/json")
  public ResponseEntity<ExternalRequestor> createExternalRequestor(
      @RequestBody ExternalRequesterDto externalRequestorDto) {

    String externalRequestorName = externalRequestorDto.getName();
    Optional<ExternalRequestor> externalRequestorOptional =
        externalRequestorRepository.findByName(externalRequestorName);

    if (externalRequestorOptional.isPresent()) {
      throw new ResourceAlreadyExists(
          String.format("External Requestor with name %s already exists", externalRequestorName));
    }
    ExternalRequestor externalRequestor =
        ExternalRequestor.builder()
            .name(externalRequestorDto.getName())
            .description(externalRequestorDto.getDescription())
            .displayColor(externalRequestorDto.getDisplayColor())
            .build();
    ExternalRequestor createdExternalRequestor =
        externalRequestorRepository.save(externalRequestor);

    return new ResponseEntity<>(createdExternalRequestor, HttpStatus.OK);
  }

  @PutMapping(
      value = "/api/tickets/externalRequestors/{externalRequestorId}",
      consumes = "application/json",
      produces = "application/json")
  public ResponseEntity<ExternalRequestor> updateExternalRequestor(
      @PathVariable Long externalRequestorId,
      @RequestBody ExternalRequesterDto externalRequestorDto) {
    ExternalRequestor foundExternalRequestor =
        externalRequestorRepository
            .findById(externalRequestorId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(
                            "External requestor with id %s not found", externalRequestorId)));

    foundExternalRequestor.setName(externalRequestorDto.getName());
    foundExternalRequestor.setDescription(externalRequestorDto.getDescription());
    foundExternalRequestor.setDisplayColor(externalRequestorDto.getDisplayColor());

    ExternalRequestor updatedExternalRequestor =
        externalRequestorRepository.save(foundExternalRequestor);

    return new ResponseEntity<>(updatedExternalRequestor, HttpStatus.OK);
  }

  @DeleteMapping(value = "/api/tickets/externalRequestors/{externalRequestorId}")
  public ResponseEntity<Void> deleteExternalRequestor(@PathVariable Long externalRequestorId) {
    ExternalRequestor foundExternalRequestor =
        externalRequestorRepository
            .findById(externalRequestorId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(
                            "External requestor with id %s not found", externalRequestorId)));
    List<TicketExternalRequestor> associations =
        ticketExternalRequestorRepository.findAllByExternalRequestor(foundExternalRequestor);
    if (!associations.isEmpty()) {
      throw new ResourceInUseProblem(
          String.format(
              "External Requestor with ID %s is mapped to tickets and can't be deleted",
              externalRequestorId));
    }
    externalRequestorRepository.deleteById(externalRequestorId);
    return ResponseEntity.noContent().build();
  }

  @PostMapping(value = "/api/tickets/{ticketId}/externalRequestors/{externalRequestorId}")
  @Transactional
  public ResponseEntity<ExternalRequestor> addExternalRequestorToTicket(
      @PathVariable Long externalRequestorId,
      @PathVariable Long ticketId,
      @RequestBody(required = false) AddExternalRequestorToTicketRequest request) {
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
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));

    if (ticketExternalRequestorRepository
        .findByTicketAndExternalRequestor(ticket, externalRequestor)
        .isPresent()) {
      throw new ResourceAlreadyExists(
          String.format("External requestor already associated with Ticket Id %s", ticketId));
    }
    LocalDate dateRequested = request != null ? request.dateRequested() : null;
    TicketExternalRequestor association =
        TicketExternalRequestor.builder()
            .ticket(ticket)
            .externalRequestor(externalRequestor)
            .dateRequested(dateRequested)
            .build();
    ticketExternalRequestorRepository.save(association);
    return new ResponseEntity<>(externalRequestor, HttpStatus.OK);
  }

  @PutMapping(value = "/api/tickets/{ticketId}/externalRequestors/{externalRequestorId}")
  @Transactional
  public ResponseEntity<ExternalRequestor> updateExternalRequestorDateOnTicket(
      @PathVariable Long ticketId,
      @PathVariable Long externalRequestorId,
      @RequestBody AddExternalRequestorToTicketRequest request) {
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
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));
    TicketExternalRequestor association =
        ticketExternalRequestorRepository
            .findByTicketAndExternalRequestor(ticket, externalRequestor)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(
                            "External requestor %s not associated with ticket %s",
                            externalRequestorId, ticketId)));
    LocalDate dateRequested = request != null ? request.dateRequested() : null;
    association.setDateRequested(dateRequested);
    ticketExternalRequestorRepository.save(association);
    return new ResponseEntity<>(externalRequestor, HttpStatus.OK);
  }

  @DeleteMapping("/api/tickets/{ticketId}/externalRequestors/{externalRequestorId}")
  @Transactional
  public ResponseEntity<ExternalRequestor> removeExternalRequestorFromTicket(
      @PathVariable Long ticketId, @PathVariable Long externalRequestorId) {
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
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId)));
    TicketExternalRequestor association =
        ticketExternalRequestorRepository
            .findByTicketAndExternalRequestor(ticket, externalRequestor)
            .orElseThrow(
                () ->
                    new ResourceAlreadyExists(
                        String.format(
                            "External requestor already not associated with Ticket Id %s",
                            ticketId)));
    ticketExternalRequestorRepository.delete(association);
    return new ResponseEntity<>(externalRequestor, HttpStatus.OK);
  }
}
