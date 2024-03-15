package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ResourceAlreadyExists;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.JsonFieldDto;
import com.csiro.tickets.models.JsonField;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.mappers.JsonFieldMapper;
import com.csiro.tickets.repository.JsonFieldRepository;
import com.csiro.tickets.repository.TicketRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tickets/json-fields")
public class JsonFieldController {

  private static final String JSON_FIELD_WITH_ID_NOT_FOUND = "JsonField with id %s not found";
  private final JsonFieldRepository jsonFieldRepository;
  private final TicketRepository ticketRepository;

  @Autowired
  public JsonFieldController(
      JsonFieldRepository jsonFieldRepository, TicketRepository ticketRepository) {
    this.jsonFieldRepository = jsonFieldRepository;
    this.ticketRepository = ticketRepository;
  }

  @GetMapping("/{ticketId}")
  public ResponseEntity<List<JsonFieldDto>> getAllJsonFields(@PathVariable Long ticketId) {
    List<JsonFieldDto> jsonFields =
        jsonFieldRepository.findAll().stream()
            .map(JsonFieldMapper::mapToDto)
            .collect(Collectors.toList());
    return new ResponseEntity<>(jsonFields, HttpStatus.OK);
  }

  @Transactional
  @PostMapping("/{ticketId}")
  public ResponseEntity<JsonFieldDto> createJsonField(
      @PathVariable Long ticketId, @RequestBody JsonField jsonField) {
    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);
    if (ticketOptional.isEmpty()) {
      throw new ResourceNotFoundProblem(String.format("Ticket with id %s not found", ticketId));
    }

    Ticket ticket = ticketOptional.get();
    String jsonFieldName = jsonField.getName();
    Optional<JsonField> jsonFieldOptional =
        jsonFieldRepository.findByNameAndTicket(jsonFieldName, ticket);
    if (jsonFieldOptional.isPresent()) {
      throw new ResourceAlreadyExists(
          String.format("JsonField with name %s already exists for the ticket", jsonFieldName));
    }

    jsonField.setTicket(ticket);
    JsonField jsonFieldToAdd = jsonFieldRepository.save(jsonField);
    return new ResponseEntity<>(JsonFieldMapper.mapToDto(jsonFieldToAdd), HttpStatus.CREATED);
  }

  @Transactional
  @PutMapping("/{jsonFieldId}")
  public ResponseEntity<JsonFieldDto> updateJsonField(
      @PathVariable Long jsonFieldId, @RequestBody JsonFieldDto jsonFieldDto) {
    JsonField foundJsonField =
        jsonFieldRepository
            .findById(jsonFieldId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(JSON_FIELD_WITH_ID_NOT_FOUND, jsonFieldId)));
    foundJsonField.setValue(jsonFieldDto.getValue());
    jsonFieldRepository.save(foundJsonField);
    return new ResponseEntity<>(JsonFieldMapper.mapToDto(foundJsonField), HttpStatus.OK);
  }

  @Transactional
  @DeleteMapping("/{jsonFieldId}")
  public ResponseEntity<Void> deleteJsonField(@PathVariable Long jsonFieldId) {
    if (!jsonFieldRepository.existsById(jsonFieldId)) {
      throw new ResourceNotFoundProblem(String.format(JSON_FIELD_WITH_ID_NOT_FOUND, jsonFieldId));
    }
    jsonFieldRepository.deleteById(jsonFieldId);
    return new ResponseEntity<>(HttpStatus.NO_CONTENT);
  }

  @GetMapping("/{jsonFieldId}")
  public ResponseEntity<JsonFieldDto> getJsonField(@PathVariable Long jsonFieldId) {
    JsonField jsonField =
        jsonFieldRepository
            .findById(jsonFieldId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(JSON_FIELD_WITH_ID_NOT_FOUND, jsonFieldId)));
    return new ResponseEntity<>(JsonFieldMapper.mapToDto(jsonField), HttpStatus.OK);
  }
}
