package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ErrorMessages;
import com.csiro.snomio.exception.ResourceAlreadyExists;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LabelController {

  @Autowired TicketRepository ticketRepository;

  @Autowired LabelRepository labelRepository;

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
