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
import au.gov.digitalhealth.tickets.TicketHistoryEntryDto;
import au.gov.digitalhealth.tickets.models.CustomRevInfo;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.repository.CustomRevInfoRepository;
import au.gov.digitalhealth.tickets.repository.TicketAuditRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class TicketHistoryService {

  private final TicketRepository ticketRepository;
  private final TicketAuditRepository ticketAuditRepository;
  private final TicketChangeProcessingService changeProcessor;

  CustomRevInfoRepository customRevInfoRepository;

  public TicketHistoryService(
      TicketRepository ticketRepository,
      TicketAuditRepository ticketAuditRepository,
      TicketChangeProcessingService changeProcessor,
      CustomRevInfoRepository customRevInfoRepository) {
    this.ticketRepository = ticketRepository;
    this.ticketAuditRepository = ticketAuditRepository;
    this.changeProcessor = changeProcessor;
    this.customRevInfoRepository = customRevInfoRepository;
  }

  public List<TicketHistoryEntryDto> getTicketHistory(String ticketNumber) {
    // Find ticket
    Ticket ticket =
        ticketRepository
            .findByTicketNumber(ticketNumber)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.TICKET_NUMBER_NOT_FOUND, ticketNumber)));

    Long ticketId = ticket.getId();
    List<TicketHistoryEntryDto> history = new ArrayList<>();

    // Get all revisions for this ticket
    List<CustomRevInfo> revisions = customRevInfoRepository.findRevisionsForTicket(ticketId);

    // Process field changes between consecutive revisions
    history.addAll(processFieldChanges(ticketId, revisions));

    // Process relationship changes
    history.addAll(processLabelChanges(ticketId));
    history.addAll(processCommentChanges(ticketId));
    history.addAll(processExternalRequestorChanges(ticketId));
    history.addAll(processAdditionalFieldValueChanges(ticketId));
    history.addAll(processTicketAssociationChanges(ticketId));
    history.addAll(processTaskAssociationChanges(ticketId));

    // Sort by timestamp
    return history.stream()
        .sorted(Comparator.comparing(TicketHistoryEntryDto::getTimestamp))
        .collect(Collectors.toList());
  }

  private List<TicketHistoryEntryDto> processFieldChanges(
      Long ticketId, List<CustomRevInfo> revisions) {
    if (revisions.size() <= 1) {
      return new ArrayList<>();
    }

    List<TicketHistoryEntryDto> changes = new ArrayList<>();
    List<Object[]> auditData =
        ticketAuditRepository.findAllTicketRevisions(
            ticketId, revisions.stream().map(CustomRevInfo::getRev).toList());

    // Process consecutive pairs
    for (int i = 1; i < auditData.size(); i++) {
      Object[] previous = auditData.get(i - 1);
      Object[] current = auditData.get(i);

      // Create the comparison data structure your changeProcessor expects
      Object[] fieldData = createFieldDataArray(previous, current);
      CustomRevInfo currentRev = revisions.get(i); // Assuming same order

      changes.addAll(changeProcessor.processFieldChanges(fieldData, currentRev));
    }

    return changes;
  }

  private Object[] createFieldDataArray(Object[] previous, Object[] current) {

    return new Object[] {
      previous[1], current[1], // title (prev, curr)
      previous[2], current[2], // description (prev, curr)
      previous[3], current[3], // assignee (prev, curr)
      previous[4], current[4], // state_id (prev, curr)
      previous[5], current[5], // priority_bucket_id (prev, curr)
      previous[6], current[6], // iteration_id (prev, curr)
      previous[7], current[7] // ticket_type_id (prev, curr)
    };
  }

  private List<TicketHistoryEntryDto> processLabelChanges(Long ticketId) {
    List<Object[]> labelData = ticketAuditRepository.findLabelChanges(ticketId);
    return changeProcessor.processLabelChanges(labelData);
  }

  private List<TicketHistoryEntryDto> processCommentChanges(Long ticketId) {
    List<Object[]> commentData = ticketAuditRepository.findCommentChanges(ticketId);
    return changeProcessor.processCommentChanges(commentData);
  }

  private List<TicketHistoryEntryDto> processExternalRequestorChanges(Long ticketId) {
    List<Object[]> requestorData = ticketAuditRepository.findExternalRequestorChanges(ticketId);
    return changeProcessor.processExternalRequestorChanges(requestorData);
  }

  private List<TicketHistoryEntryDto> processAdditionalFieldValueChanges(Long ticketId) {

    List<Object[]> fieldValueData = ticketAuditRepository.findAdditionalFieldValueChanges(ticketId);

    return changeProcessor.processAdditionalFieldData(fieldValueData);
  }

  private List<TicketHistoryEntryDto> processTicketAssociationChanges(Long ticketId) {
    List<Object[]> associationData = ticketAuditRepository.findTicketAssociationChanges(ticketId);

    return changeProcessor.processTicketAssociationData(associationData, ticketId);
  }

  private List<TicketHistoryEntryDto> processTaskAssociationChanges(Long ticketId) {
    List<Object[]> taskData = ticketAuditRepository.findTaskAssociationChanges(ticketId);

    return changeProcessor.processTaskAssociationData(taskData);
  }
}
