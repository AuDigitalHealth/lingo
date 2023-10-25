package com.csiro.tickets.service;

import com.csiro.snomio.exception.ErrorMessages;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.helper.AdditionalFieldUtils;
import com.csiro.tickets.helper.CsvUtils;
import com.csiro.tickets.models.Iteration;
import com.csiro.tickets.models.Label;
import com.csiro.tickets.models.PriorityBucket;
import com.csiro.tickets.models.State;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.IterationRepository;
import com.csiro.tickets.repository.LabelRepository;
import com.csiro.tickets.repository.StateRepository;
import com.csiro.tickets.repository.TicketRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

@Component
public class ExportService {

  @Autowired TicketRepository ticketRepository;

  @Autowired LabelRepository labelRepository;

  @Autowired IterationRepository iterationRepository;

  @Autowired StateRepository stateRepository;

  public static final List<String> NON_EXTERNAL_REQUESTERS =
      Arrays.asList("JiraExport", "SAS", "BlackTriangle");

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

    List<Ticket> tickets = ticketRepository.findAllByAdhaQuery(iteration.getId(), state.getId());

    // remove the ticket's that don't have at least one of the external requester labels
    // This is like this (and not a part of the adha query_ because I believe it to be a short term
    // fix,
    // I believe the intent is to do something different with external requester labels
    // Either add another column to labels, or move them somewhere else I am not sure

    tickets =
        tickets.stream()
            .filter(
                ticket -> {
                  boolean returnVal = false;
                  for (Label label : ticket.getLabels()) {
                    if (!NON_EXTERNAL_REQUESTERS.contains(label.getName())) {
                      returnVal = true;
                      break;
                    }
                  }
                  return returnVal;
                })
            .sorted(
                Comparator.comparing(
                        (Ticket obj) -> {
                          PriorityBucket pb1 = obj.getPriorityBucket();
                          return pb1 != null ? pb1.getOrderIndex() : null;
                        },
                        Comparator.nullsLast(Integer::compareTo))
                    .thenComparing(
                        (Ticket obj) -> {
                          String dateRequested =
                              AdditionalFieldUtils.findValueByAdditionalFieldName("StartDate", obj);
                          if (dateRequested == null) return null;
                          LocalDate localDate =
                              LocalDate.parse(
                                  dateRequested,
                                  java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                          ZoneId brisbaneZone = ZoneId.of("Australia/Brisbane");
                          return localDate.atStartOfDay(brisbaneZone).toInstant();
                        },
                        Comparator.nullsLast(Instant::compareTo)))
            .collect(Collectors.toList());

    InputStreamResource inputStream = new InputStreamResource(CsvUtils.createAdhaCsv(tickets));

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
        .contentType(MediaType.parseMediaType("text/csv"))
        .body(inputStream);
  }
}
