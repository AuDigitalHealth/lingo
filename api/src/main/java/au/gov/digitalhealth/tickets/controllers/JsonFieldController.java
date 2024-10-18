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

import au.gov.digitalhealth.lingo.exception.ResourceAlreadyExists;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.JsonFieldDto;
import au.gov.digitalhealth.tickets.models.JsonField;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.models.mappers.JsonFieldMapper;
import au.gov.digitalhealth.tickets.repository.JsonFieldRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tickets/json-fields")
public class JsonFieldController {

  private static final String JSON_FIELD_WITH_ID_NOT_FOUND = "JsonField with id %s not found";
  private final JsonFieldRepository jsonFieldRepository;
  private final TicketRepository ticketRepository;
  private final JsonFieldMapper jsonFieldMapper;

  public JsonFieldController(
      JsonFieldRepository jsonFieldRepository,
      TicketRepository ticketRepository,
      JsonFieldMapper jsonFieldMapper) {
    this.jsonFieldRepository = jsonFieldRepository;
    this.ticketRepository = ticketRepository;
    this.jsonFieldMapper = jsonFieldMapper;
  }

  @GetMapping("/{ticketId}")
  public ResponseEntity<List<JsonFieldDto>> getAllJsonFields(@PathVariable Long ticketId) {
    List<JsonFieldDto> jsonFields =
        jsonFieldRepository.findAll().stream().map(jsonFieldMapper::toDto).toList();
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
    return new ResponseEntity<>(jsonFieldMapper.toDto(jsonFieldToAdd), HttpStatus.CREATED);
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
    return new ResponseEntity<>(jsonFieldMapper.toDto(foundJsonField), HttpStatus.OK);
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
    return new ResponseEntity<>(jsonFieldMapper.toDto(jsonField), HttpStatus.OK);
  }
}
