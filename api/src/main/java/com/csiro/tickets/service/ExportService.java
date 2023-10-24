package com.csiro.tickets.service;

import com.csiro.tickets.helper.CsvUtils;
import com.csiro.tickets.models.Iteration;
import com.csiro.tickets.models.Label;
import com.csiro.tickets.models.State;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.IterationRepository;
import com.csiro.tickets.repository.LabelRepository;
import com.csiro.tickets.repository.StateRepository;
import com.csiro.tickets.repository.TicketRepository;
import java.io.ByteArrayInputStream;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class ExportService {

  @Autowired TicketRepository ticketRepository;

  @Autowired LabelRepository labelRepository;

  @Autowired IterationRepository iterationRepository;

  @Autowired StateRepository stateRepository;

  public static final List<String> NON_EXTERNAL_REQUESTERS =
      Arrays.asList("JiraExport", "SAS", "BlackTriangle");

  public ByteArrayInputStream adhaCsvExport(Long iterationId) {

    Optional<Iteration> iteration = iterationRepository.findById(iterationId);
    Optional<State> state = stateRepository.findByLabel("Closed");
    List<Ticket> tickets =
        ticketRepository.findAllByAdhaQuery(iteration.get().getId(), state.get().getId());

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
                    }
                  }
                  return returnVal;
                })
            .collect(Collectors.toList());

    return CsvUtils.createAdhaCsv(tickets);
  }
}
