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
package au.gov.digitalhealth.tickets.service;

import au.gov.digitalhealth.lingo.exception.ErrorMessages;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.AdditionalFieldTypeDto;
import au.gov.digitalhealth.tickets.AdditionalFieldValueDto;
import au.gov.digitalhealth.tickets.AdditionalFieldValuesForListTypeDto;
import au.gov.digitalhealth.tickets.helper.FieldValueTicketPair;
import au.gov.digitalhealth.tickets.models.AdditionalFieldType;
import au.gov.digitalhealth.tickets.models.AdditionalFieldType.Type;
import au.gov.digitalhealth.tickets.models.AdditionalFieldValue;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.models.mappers.AdditionalFieldTypeMapper;
import au.gov.digitalhealth.tickets.models.mappers.AdditionalFieldValueMapper;
import au.gov.digitalhealth.tickets.repository.AdditionalFieldTypeRepository;
import au.gov.digitalhealth.tickets.repository.AdditionalFieldValueRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import jakarta.transaction.Transactional;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.apache.commons.collections4.MultiValuedMap;
import org.apache.commons.collections4.multimap.HashSetValuedHashMap;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@Service
public class AdditionalFieldService {
  private final AdditionalFieldTypeRepository additionalFieldTypeRepository;

  private final AdditionalFieldValueRepository additionalFieldValueRepository;

  private final TicketRepository ticketRepository;

  private final AdditionalFieldTypeMapper additionalFieldTypeMapper;
  private final AdditionalFieldValueMapper additionalFieldValueMapper;

  @Autowired
  public AdditionalFieldService(
      AdditionalFieldTypeRepository additionalFieldTypeRepository,
      AdditionalFieldValueRepository additionalFieldValueRepository,
      TicketRepository ticketRepository,
      AdditionalFieldTypeMapper additionalFieldTypeMapper,
      AdditionalFieldValueMapper additionalFieldValueMapper) {
    this.additionalFieldTypeRepository = additionalFieldTypeRepository;
    this.additionalFieldValueRepository = additionalFieldValueRepository;
    this.ticketRepository = ticketRepository;
    this.additionalFieldTypeMapper = additionalFieldTypeMapper;
    this.additionalFieldValueMapper = additionalFieldValueMapper;
  }

  public Set<AdditionalFieldTypeDto> getAllAdditionalFieldTypes() {
    return additionalFieldTypeRepository.findAll().stream()
        .map(additionalFieldTypeMapper::toDto)
        .collect(Collectors.toSet());
  }

  @Transactional
  public AdditionalFieldValueDto createTicketAdditionalField(
      Long ticketId, Long additionalFieldTypeId, String valueOf) {

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
      return additionalFieldValueMapper.toDto(afve);
    }

    // update existing value of this type for this ticket - say update the artgid, startdate etc
    if (additionalFieldValueOptional.isPresent()) {
      AdditionalFieldValue additionalFieldValue = additionalFieldValueOptional.get();
      additionalFieldValue.setValueOf(valueOf);
      AdditionalFieldValue nafv = additionalFieldValueRepository.save(additionalFieldValue);

      return additionalFieldValueMapper.toDto(nafv);
    }

    // isn't a list, this ticket doesn't have a value for this type, so we create a new one
    AdditionalFieldValue afv =
        AdditionalFieldValue.builder()
            .tickets(List.of(ticket))
            .additionalFieldType(additionalFieldType)
            .valueOf(valueOf)
            .build();

    ticket.getAdditionalFieldValues().add(afv);
    ticketRepository.save(ticket);
    return additionalFieldValueMapper.toDto(afv);
  }

  @Transactional
  public AdditionalFieldValueDto createTicketAdditionalField(
      Long ticketId, Long additionalFieldTypeId, AdditionalFieldValueDto afv) {

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
              .findByValueOfAndTypeId(additionalFieldType, afv.getValueOf())
              .orElseThrow(
                  () ->
                      new ResourceNotFoundProblem(
                          String.format(
                              ErrorMessages.ADDITIONAL_FIELD_VALUE_ID_NOT_FOUND,
                              afv.getValueOf())));

      additionalFieldValueOptional.ifPresent(
          additionalFieldValue -> ticket.getAdditionalFieldValues().remove(additionalFieldValue));

      ticket.getAdditionalFieldValues().add(afve);
      ticketRepository.save(ticket);
      return additionalFieldValueMapper.toDto(afve);
    }

    // update existing value of this type for this ticket - say update the artgid, startdate etc
    if (additionalFieldValueOptional.isPresent()) {
      AdditionalFieldValue additionalFieldValue = additionalFieldValueOptional.get();
      additionalFieldValue.setValueOf(afv.getValueOf());
      AdditionalFieldValue nafv = additionalFieldValueRepository.save(additionalFieldValue);
      return additionalFieldValueMapper.toDto(nafv);
    }

    // isn't a list, this ticket doesn't have a value for this type, so we create a new one
    AdditionalFieldValue afvLocal =
        AdditionalFieldValue.builder()
            .tickets(List.of(ticket))
            .additionalFieldType(additionalFieldType)
            .valueOf(afv.getValueOf())
            .build();

    ticket.getAdditionalFieldValues().add(afvLocal);
    ticketRepository.save(ticket);
    return additionalFieldValueMapper.toDto(afvLocal);
  }

  public Map<String, Collection<Long>> getAllValuesByAdditionalFieldType(Long aftId) {
    AdditionalFieldType aft =
        additionalFieldTypeRepository
            .findById(aftId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.ADDITIONAL_FIELD_VALUE_ID_NOT_FOUND, aftId)));
    List<FieldValueTicketPair> afvs = additionalFieldValueRepository.findByTypeIdObject(aft);

    // Transform the list of Object[] into a Map<String, Long>
    MultiValuedMap<String, Long> resultMap = new HashSetValuedHashMap<>();

    afvs.forEach(afv -> resultMap.put(afv.getValueOf(), afv.getTicketId()));

    return resultMap.asMap();
  }

  @Transactional
  public void deleteTicketAdditionalField(Long ticketId, Long additionalFieldTypeId) {

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
  }

  public Collection<AdditionalFieldValuesForListTypeDto> getAdditionalFieldValuesForListType() {

    List<AdditionalFieldValue> additionalFieldValues =
        additionalFieldValueRepository.findAdditionalFieldValuesForListType();

    Hibernate.initialize(additionalFieldValues);
    Map<Long, AdditionalFieldValuesForListTypeDto> additionalFieldValuesToReturn = new HashMap<>();
    additionalFieldValues.forEach(
        afv -> {
          AdditionalFieldValuesForListTypeDto mapEntry =
              additionalFieldValuesToReturn.get(afv.getAdditionalFieldType().getId());
          if (mapEntry == null) {
            mapEntry =
                AdditionalFieldValuesForListTypeDto.builder()
                    .typeId(afv.getAdditionalFieldType().getId())
                    .typeName(afv.getAdditionalFieldType().getName())
                    .build();
          }
          if (mapEntry.getValues() == null) {
            mapEntry.setValues(new HashSet<>());
          }
          AdditionalFieldValueDto newAdditionalFieldValueDto =
              additionalFieldValueMapper.toDto(afv);
          mapEntry.getValues().add(newAdditionalFieldValueDto);
          additionalFieldValuesToReturn.put(afv.getAdditionalFieldType().getId(), mapEntry);
        });

    return additionalFieldValuesToReturn.values();
  }

  @PostMapping(
      value = "/api/tickets/additionalFieldType",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public AdditionalFieldTypeDto createAdditionalFieldType(@RequestBody AdditionalFieldTypeDto aft) {
    return additionalFieldTypeMapper.toDto(
        additionalFieldTypeRepository.save(additionalFieldTypeMapper.toEntity(aft)));
  }
}
