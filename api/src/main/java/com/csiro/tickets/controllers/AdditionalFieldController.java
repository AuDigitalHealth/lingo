package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ErrorMessages;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.controllers.dto.AdditionalFieldValueDto;
import com.csiro.tickets.controllers.dto.AdditionalFieldValueListTypeQueryDto;
import com.csiro.tickets.controllers.dto.AdditionalFieldValuesForListTypeDto;
import com.csiro.tickets.models.AdditionalFieldType;
import com.csiro.tickets.models.AdditionalFieldType.Type;
import com.csiro.tickets.models.AdditionalFieldValue;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.AdditionalFieldTypeRepository;
import com.csiro.tickets.repository.AdditionalFieldValueRepository;
import com.csiro.tickets.repository.TicketRepository;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdditionalFieldController {

  @Autowired private AdditionalFieldTypeRepository additionalFieldTypeRepository;

  @Autowired private AdditionalFieldValueRepository additionalFieldValueRepository;

  @Autowired private TicketRepository ticketRepository;

  @GetMapping("/api/tickets/additionalFieldTypes")
  public ResponseEntity<List<AdditionalFieldType>> getAllAdditionalFieldTypes() {
    List<AdditionalFieldType> additionalFieldTypes = additionalFieldTypeRepository.findAll();

    return new ResponseEntity<>(additionalFieldTypes, HttpStatus.OK);
  }

  @PostMapping(
      value = "/api/tickets/{ticketId}/additionalFieldValue/{additionalFieldTypeId}/{valueOf}")
  public ResponseEntity<AdditionalFieldValue> createTicketAdditionalField(
      @PathVariable Long ticketId,
      @PathVariable Long additionalFieldTypeId,
      @PathVariable String valueOf) {

    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);

    if (ticketOptional.isEmpty()) {
      throw new ResourceNotFoundProblem(String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId));
    }
    Ticket ticket = ticketOptional.get();

    AdditionalFieldType additionalFieldType =
        additionalFieldTypeRepository
            .findById(additionalFieldTypeId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(
                            ErrorMessages.ADDITIONAL_FIELD_VALUE_ID_NOT_FOUND,
                            additionalFieldTypeId)));
    Optional<AdditionalFieldValue> additionalFieldValueOptional =
        additionalFieldValueRepository.findAllByTicketAndType(ticket, additionalFieldType);

    // if list type - find the existing value for that type with valueOf
    if (additionalFieldType.getType().equals(Type.LIST)) {
      AdditionalFieldValue afve =
          additionalFieldValueRepository
              .findByValueOfAndTypeId(additionalFieldType, valueOf)
              .orElseThrow(
                  () ->
                      new ResourceNotFoundProblem(
                          String.format(
                              ErrorMessages.ADDITIONAL_FIELD_VALUE_ID_NOT_FOUND, valueOf)));

      additionalFieldValueOptional.ifPresent(
          additionalFieldValue -> ticket.getAdditionalFieldValues().remove(additionalFieldValue));

      ticket.getAdditionalFieldValues().add(afve);
      ticketRepository.save(ticket);
      return new ResponseEntity<>(afve, HttpStatus.OK);
    }

    // update existing value of this type for this ticket - say update the artgid, startdate etc
    if (additionalFieldValueOptional.isPresent()) {
      AdditionalFieldValue additionalFieldValue = additionalFieldValueOptional.get();
      additionalFieldValue.setValueOf(valueOf);
      AdditionalFieldValue nafv = additionalFieldValueRepository.save(additionalFieldValue);
      return new ResponseEntity<>(nafv, HttpStatus.OK);
    }

    // isn't a list, this ticket doesn't have a value for this type, so we create a new one
    AdditionalFieldValue afv =
        AdditionalFieldValue.builder()
            .tickets(Arrays.asList(ticket))
            .additionalFieldType(additionalFieldType)
            .valueOf(valueOf)
            .build();

    ticket.getAdditionalFieldValues().add(afv);
    ticketRepository.save(ticket);
    return new ResponseEntity<>(afv, HttpStatus.OK);
  }

  @DeleteMapping(value = "/api/tickets/{ticketId}/additionalFieldValue/{additionalFieldTypeId}")
  public ResponseEntity<Void> deleteTicketAdditionalField(
      @PathVariable Long ticketId, @PathVariable Long additionalFieldTypeId) {

    Optional<Ticket> ticketOptional = ticketRepository.findById(ticketId);

    if (ticketOptional.isEmpty()) {
      throw new ResourceNotFoundProblem(String.format(ErrorMessages.TICKET_ID_NOT_FOUND, ticketId));
    }
    Ticket ticket = ticketOptional.get();

    AdditionalFieldType additionalFieldType =
        additionalFieldTypeRepository
            .findById(additionalFieldTypeId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(
                            ErrorMessages.ADDITIONAL_FIELD_VALUE_ID_NOT_FOUND,
                            additionalFieldTypeId)));

    AdditionalFieldValue additionalFieldValue =
        additionalFieldValueRepository
            .findAllByTicketAndType(ticket, additionalFieldType)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(
                            ErrorMessages.ADDITIONAL_FIELD_VALUE_ID_NOT_FOUND,
                            additionalFieldTypeId)));

    ticket.getAdditionalFieldValues().remove(additionalFieldValue);
    ticketRepository.save(ticket);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/api/additionalFieldValuesForListType")
  public ResponseEntity<List<AdditionalFieldValuesForListTypeDto>>
      getAdditionalFieldValuesForListType() {
    List<AdditionalFieldValueListTypeQueryDto> additionalFieldValues =
        additionalFieldValueRepository.findAdditionalFieldValuesForListType();
    Hibernate.initialize(additionalFieldValues);
    Map<Long, AdditionalFieldValuesForListTypeDto> additionalFieldValuesToReturn =
        new HashMap<Long, AdditionalFieldValuesForListTypeDto>();
    additionalFieldValues.forEach(
        afv -> {
          AdditionalFieldValuesForListTypeDto mapEntry =
              additionalFieldValuesToReturn.get(afv.getTypeId());
          if (mapEntry == null) {
            mapEntry =
                AdditionalFieldValuesForListTypeDto.builder()
                    .typeId(afv.getTypeId())
                    .typeName(afv.getTypeName())
                    .build();
          }
          if (mapEntry.getValues() == null) {
            mapEntry.setValues(new HashSet<AdditionalFieldValueDto>());
          }
          AdditionalFieldValueDto newAdditionalFieldValueDto =
              AdditionalFieldValueDto.builder()
                  .additionalFieldType(
                      AdditionalFieldType.builder()
                          .name(afv.getTypeName())
                          .type(afv.getType())
                          .id(afv.getTypeId())
                          .build())
                  .valueOf(afv.getValue())
                  .build();
          mapEntry.getValues().add(newAdditionalFieldValueDto);
          additionalFieldValuesToReturn.put(afv.getTypeId(), mapEntry);
        });
    List<AdditionalFieldValuesForListTypeDto> returnValue =
        new ArrayList<AdditionalFieldValuesForListTypeDto>(additionalFieldValuesToReturn.values());

    return new ResponseEntity<>(returnValue, HttpStatus.OK);
  }
}
