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
import au.gov.digitalhealth.lingo.exception.ResourceAlreadyExists;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.TicketAssociationDto;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.models.TicketAssociation;
import au.gov.digitalhealth.tickets.models.mappers.TicketAssociationMapper;
import au.gov.digitalhealth.tickets.repository.TicketAssociationRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@Log
public class TicketAssociationService {

  final TicketRepository ticketRepository;
  final TicketAssociationRepository ticketAssociationRepository;
  final TicketAssociationMapper ticketAssociationMapper;

  @Autowired
  public TicketAssociationService(
      TicketRepository ticketRepository,
      TicketAssociationRepository ticketAssociationRepository,
      TicketAssociationMapper ticketAssociationMapper) {
    this.ticketRepository = ticketRepository;
    this.ticketAssociationRepository = ticketAssociationRepository;
    this.ticketAssociationMapper = ticketAssociationMapper;
  }

  public TicketAssociationDto createAssociation(Long sourceId, Long targetId) {
    Ticket sourceTicket =
        ticketRepository
            .findById(sourceId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, sourceId)));

    Ticket targetTicket =
        ticketRepository
            .findById(targetId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_ID_NOT_FOUND, targetId)));

    List<TicketAssociation> existingAssociation =
        ticketAssociationRepository.findBySourceAndTargetFlipped(sourceTicket, targetTicket);
    if (!existingAssociation.isEmpty()) {
      throw new ResourceAlreadyExists(
          String.format(
              ErrorMessages.TICKET_ASSOCIATION_EXISTS, sourceTicket.getId(), targetTicket.getId()));
    }

    TicketAssociation ticketAssociation =
        TicketAssociation.builder()
            .associationSource(sourceTicket)
            .associationTarget(targetTicket)
            .build();

    return ticketAssociationMapper.toDto(ticketAssociationRepository.save(ticketAssociation));
  }

  public void deleteAssociation(Long id) {
    TicketAssociation ticketAssociation =
        ticketAssociationRepository
            .findById(id)
            .orElseThrow(
                () -> new ResourceNotFoundProblem(String.format(ErrorMessages.ID_NOT_FOUND, id)));

    ticketAssociation.setAssociationSource(null);
    ticketAssociation.setAssociationTarget(null);

    ticketAssociationRepository.save(ticketAssociation);
    ticketAssociationRepository.delete(ticketAssociation);
  }

  public Set<TicketAssociationDto> getTicketSourceAssociations(Set<Long> ticketIds) {
    log.info(
        "Getting associations for ticket ids: "
            + ticketIds.stream().map(String::valueOf).collect(Collectors.joining(",")));
    Set<TicketAssociation> byAssociationSourceIdIn =
        ticketAssociationRepository.findByAssociationSource_IdIn(ticketIds);
    log.info(
        "Found associations: "
            + byAssociationSourceIdIn.stream()
                .map(TicketAssociation::toString)
                .collect(Collectors.joining(", \n")));
    return ticketAssociationMapper.toDtoSet(byAssociationSourceIdIn);
  }

  public Set<TicketAssociationDto> getAssociationsForTicket(Long ticketId) {
    Set<TicketAssociation> associations =
        ticketAssociationRepository.findByAssociationSourceIdOrAssociationTargetId(ticketId);
    return associations.stream().map(ticketAssociationMapper::toDto).collect(Collectors.toSet());
  }
}
