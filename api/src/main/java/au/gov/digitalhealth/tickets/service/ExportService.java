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
import au.gov.digitalhealth.tickets.helper.CsvUtils;
import au.gov.digitalhealth.tickets.models.Iteration;
import au.gov.digitalhealth.tickets.models.PriorityBucket;
import au.gov.digitalhealth.tickets.models.State;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.repository.IterationRepository;
import au.gov.digitalhealth.tickets.repository.LabelRepository;
import au.gov.digitalhealth.tickets.repository.StateRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

@Component
public class ExportService {

  public static final List<String> NON_EXTERNAL_REQUESTERS =
      List.of("JiraExport", "SAS", "BlackTriangle");
  final TicketRepository ticketRepository;
  final LabelRepository labelRepository;
  final IterationRepository iterationRepository;
  final StateRepository stateRepository;

  @Autowired
  public ExportService(
      TicketRepository ticketRepository,
      LabelRepository labelRepository,
      IterationRepository iterationRepository,
      StateRepository stateRepository) {
    this.ticketRepository = ticketRepository;
    this.labelRepository = labelRepository;
    this.iterationRepository = iterationRepository;
    this.stateRepository = stateRepository;
  }

  @Transactional
  public ResponseEntity<InputStreamResource> adhaCsvExport(Long iterationId) {

    StringBuilder filename = new StringBuilder().append("SnomioTickets_ExternallyRequested_");

    Iteration iteration =
        iterationRepository
            .findById(iterationId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(ErrorMessages.ITERATION_NOT_FOUND, iterationId)));

    filename.append(iteration.getName().replaceAll("\\s", ""));
    filename.append(".csv");

    State state =
        stateRepository
            .findByLabel("Closed")
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format("State with label %s not found", "Closed")));

    List<Ticket> tickets =
        ticketRepository.findAllByIterationAdhaQuery(iteration.getId(), state.getId());

    List<Ticket> otherTickets = ticketRepository.findAllAdhaQuery(state.getId());

    tickets = sortAdhaTickets(tickets);

    otherTickets = sortAdhaTickets(otherTickets);

    tickets.addAll(otherTickets);

    InputStreamResource inputStream = new InputStreamResource(CsvUtils.createAdhaCsv(tickets));

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
        .contentType(MediaType.parseMediaType("text/csv"))
        .body(inputStream);
  }

  public List<Ticket> sortAdhaTickets(List<Ticket> tickets) {
    return new ArrayList<>(
        tickets.stream()
            .sorted(
                Comparator.comparing(
                        (Ticket obj) -> {
                          PriorityBucket pb1 = obj.getPriorityBucket();
                          return pb1 != null ? pb1.getOrderIndex() : null;
                        },
                        Comparator.nullsLast(Integer::compareTo))
                    .thenComparing(Ticket::getTitle, Comparator.nullsLast(String::compareTo)))
            .toList());
  }
}
