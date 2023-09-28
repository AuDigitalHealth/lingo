package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ResourceAlreadyExists;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.models.Label;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.LabelRepository;
import com.csiro.tickets.repository.TicketRepository;
import java.util.ArrayList;
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

  @PostMapping(
      value = "/api/tickets/{ticketId}/labels",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Label> createLabel(@RequestBody Label label, @PathVariable Long ticketId) {
    Optional<Label> labelOptional = labelRepository.findByName(label.getName());
    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);

    if (labelOptional.isPresent() && ticketOptional.isPresent()) {
      Ticket ticket = ticketOptional.get();
      Label existingLabel = labelOptional.get();
      if (ticket.getLabels().contains(existingLabel)) {
        throw new ResourceAlreadyExists(
            String.format("Label already associated with Ticket Id %s", ticketId));
      }
      ticket.getLabels().add(existingLabel);
      ticketRepository.save(ticket);
      return new ResponseEntity<>(existingLabel, HttpStatus.OK);
    }

    if (!ticketOptional.isPresent()) {
      throw new ResourceNotFoundProblem(String.format("Ticket with ID %s not found", ticketId));
    }
    Label newLabel = label.toBuilder().build();
    Ticket theTicket = ticketOptional.get();
    newLabel.setTicket(new ArrayList<Ticket>());
    newLabel.getTicket().add(theTicket);
    labelRepository.save(newLabel);
    theTicket.getLabels().add(newLabel);
    ticketRepository.save(theTicket);

    return new ResponseEntity<>(newLabel, HttpStatus.OK);
  }

  @DeleteMapping("/api/tickets/{ticketId}/labels/{labelId}")
  public ResponseEntity<Ticket> deleteLabel(
      @PathVariable Long ticketId, @PathVariable Long labelId) {
    Optional<Label> labelOptional = labelRepository.findById(labelId);
    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);

    if (labelOptional.isPresent() && ticketOptional.isPresent()) {
      Ticket ticket = ticketOptional.get();
      Label label = labelOptional.get();
      if (ticket.getLabels().contains(label)) {
        ticket.getLabels().remove(label);
        Ticket updatedTicket = ticketRepository.save(ticket);
        return new ResponseEntity<>(updatedTicket, HttpStatus.OK);
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
