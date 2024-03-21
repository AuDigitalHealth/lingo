package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ErrorMessages;
import com.csiro.snomio.exception.ResourceAlreadyExists;
import com.csiro.snomio.exception.ResourceInUseProblem;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.models.Label;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.LabelRepository;
import com.csiro.tickets.repository.TicketRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class LabelController {

  final TicketRepository ticketRepository;

  final LabelRepository labelRepository;

  @Autowired
  public LabelController(TicketRepository ticketRepository, LabelRepository labelRepository) {
    this.ticketRepository = ticketRepository;
    this.labelRepository = labelRepository;
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
        && existingLabelByNewName.get().getId() != labelTypeId) { // check duplicate
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
  public ResponseEntity deleteLabelType(@PathVariable Long labelId) {
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
