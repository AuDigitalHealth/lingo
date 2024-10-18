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
import au.gov.digitalhealth.tickets.models.Label;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.repository.LabelRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import au.gov.digitalhealth.tickets.service.TicketServiceImpl;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class LabelController {

  final TicketRepository ticketRepository;

  final TicketServiceImpl ticketService;

  final LabelRepository labelRepository;

  public LabelController(
      TicketRepository ticketRepository,
      LabelRepository labelRepository,
      TicketServiceImpl ticketService) {
    this.ticketRepository = ticketRepository;
    this.labelRepository = labelRepository;
    this.ticketService = ticketService;
  }

  @GetMapping("/api/tickets/labelType")
  public ResponseEntity<List<Label>> getAllLabelTypes() {
    List<Label> labels = labelRepository.findAll();

    return new ResponseEntity<>(labels, HttpStatus.OK);
  }

  @PostMapping(value = "/api/tickets/labelType", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Label> createLabelType(@RequestBody Label label) {

    // we can have duplicate descriptions
    Optional<Label> existingLabelType = labelRepository.findByName(label.getName());
    if (existingLabelType.isPresent()) {
      throw new ResourceAlreadyExists(
          String.format("Label with name %s already exists", label.getName()));
    }
    Label createdLabel = labelRepository.save(label);
    return new ResponseEntity<>(createdLabel, HttpStatus.OK);
  }

  @PutMapping(
      value = "/api/tickets/labelType/{labelTypeId}",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Label> updateLabelType(
      @RequestBody Label label, @PathVariable Long labelTypeId) {
    Label existingLabel =
        labelRepository
            .findById(labelTypeId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format("Label with ID %s not found", labelTypeId)));

    Optional<Label> existingLabelByNewName = labelRepository.findByName(label.getName());
    if (existingLabelByNewName.isPresent()
        && !existingLabelByNewName.get().getId().equals(labelTypeId)) { // check duplicate
      throw new ResourceAlreadyExists(
          String.format("Label with name %s already exists", label.getName()));
    }
    existingLabel.setName(label.getName());
    existingLabel.setDescription(label.getDescription());
    existingLabel.setDisplayColor(label.getDisplayColor());
    Label updatedLabel = labelRepository.save(existingLabel);
    return new ResponseEntity<>(updatedLabel, HttpStatus.OK);
  }

  @DeleteMapping(value = "/api/tickets/labelType/{labelId}")
  public ResponseEntity<Void> deleteLabelType(@PathVariable Long labelId) {
    Label existingLabel =
        labelRepository
            .findById(labelId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format("Label with ID %s not found", labelId)));
    List<Ticket> tickets = ticketRepository.findAllByLabels(existingLabel);
    if (!tickets.isEmpty()) {
      throw new ResourceInUseProblem(
          String.format("Label with ID %s is mapped to tickets and can't be deleted", labelId));
    }
    labelRepository.deleteById(labelId);
    return ResponseEntity.noContent().build();
  }

  @PostMapping(value = "/api/tickets/{ticketId}/labels/{labelId}")
  public ResponseEntity<Label> createLabel(
      @PathVariable Long labelId, @PathVariable Long ticketId) {
    Label label =
        labelRepository
            .findById(labelId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.LABEL_ID_NOT_FOUND, labelId)));
    Ticket ticket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format("Ticket with ID %s not found", ticketId)));

    if (ticket.getLabels().contains(label)) {
      throw new ResourceAlreadyExists(
          String.format("Label already associated with Ticket Id %s", ticketId));
    }
    ticket.getLabels().add(label);
    ticketRepository.save(ticket);
    return new ResponseEntity<>(label, HttpStatus.OK);
  }

  @DeleteMapping("/api/tickets/{ticketId}/labels/{labelId}")
  public ResponseEntity<Label> deleteLabel(
      @PathVariable Long ticketId, @PathVariable Long labelId) {
    Optional<Label> labelOptional = labelRepository.findById(labelId);
    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);

    if (labelOptional.isPresent() && ticketOptional.isPresent()) {
      Ticket ticket = ticketOptional.get();
      Label label = labelOptional.get();
      if (ticket.getLabels().contains(label)) {
        ticket.getLabels().remove(label);
        ticketRepository.save(ticket);
        return new ResponseEntity<>(label, HttpStatus.OK);
      } else {
        throw new ResourceAlreadyExists(
            String.format("Label already not associated with Ticket Id %s", ticketId));
      }
    } else {
      String message = labelOptional.isPresent() ? "Ticket" : "Label";
      Long id = labelOptional.isPresent() ? ticketId : labelId;
      throw new ResourceNotFoundProblem(String.format("%s with ID %s not found", message, id));
    }
  }
}
