package com.csiro.tickets.service;

import com.csiro.tickets.TicketTestBase;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.models.Iteration;
import com.csiro.tickets.models.Label;
import com.csiro.tickets.models.PriorityBucket;
import com.csiro.tickets.models.State;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.IterationRepository;
import com.csiro.tickets.repository.LabelRepository;
import com.csiro.tickets.repository.PriorityBucketRepository;
import com.csiro.tickets.repository.StateRepository;
import io.restassured.http.ContentType;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class TicketServiceTest extends TicketTestBase {

  @Autowired private LabelRepository labelRepository;

  @Autowired private StateRepository stateRepository;

  @Autowired private PriorityBucketRepository priorityBucketRepository;

  @Autowired private IterationRepository iterationRepository;

  @Test
  void testCreateTicket() {

    TicketDto ticket =
        TicketDto.builder()
            .createdBy("cgillespie")
            .title("A test ticket")
            .description("This is a test description")
            .labels(null)
            .state(null)
            .ticketType(null)
            .created(Instant.now())
            .build();

    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .body(ticket)
        .post(this.getSnomioLocation() + "/api/tickets")
        .then()
        .statusCode(200);
  }

  @Test
  void testCreateTicketComplex() {
    List<Label> startAllLabels = labelRepository.findAll();
    List<State> startAllStates = stateRepository.findAll();
    List<PriorityBucket> startAllPriorities = priorityBucketRepository.findAll();
    List<Iteration> startAllIterations = iterationRepository.findAll();

    Optional<Label> label = labelRepository.findById(1L);
    List<Label> labelList = new ArrayList<>();
    labelList.add(label.get());
    Optional<State> state = stateRepository.findById(1L);
    Optional<PriorityBucket> priorityBucket = priorityBucketRepository.findById(1L);
    Optional<Iteration> iteration = iterationRepository.findById(1L);

    Ticket ticket =
        Ticket.builder()
            .title("Complex")
            .description("ticket")
            .labels(labelList)
            .state(state.get())
            .priorityBucket(priorityBucket.get())
            .iteration(iteration.get())
            .build();

    TicketDto ticketResponse =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(ticket)
            .post(this.getSnomioLocation() + "/api/tickets")
            .then()
            .statusCode(200)
            .extract()
            .as(TicketDto.class);

    List<Label> responseLabels = ticketResponse.getLabels();
    PriorityBucket responseBuckets = ticketResponse.getPriorityBucket();
    State responseState = ticketResponse.getState();
    Iteration responseIteration = ticketResponse.getIteration();

    Assertions.assertEquals(responseLabels.get(0).getId(), labelList.get(0).getId());
    Assertions.assertEquals(responseBuckets.getId(), priorityBucket.get().getId());
    Assertions.assertEquals(responseState.getId(), state.get().getId());
    Assertions.assertEquals(responseIteration.getId(), iteration.get().getId());

    List<Label> endAllLabels = labelRepository.findAll();
    List<State> endAllStates = stateRepository.findAll();
    List<PriorityBucket> endAllPriorities = priorityBucketRepository.findAll();
    List<Iteration> endAllIterations = iterationRepository.findAll();

    Assertions.assertEquals(startAllLabels.size(), endAllLabels.size());
    Assertions.assertEquals(startAllStates.size(), endAllStates.size());
    Assertions.assertEquals(startAllPriorities.size(), endAllPriorities.size());
    Assertions.assertEquals(startAllIterations.size(), endAllIterations.size());

    System.out.println(ticketResponse);
  }

  @Test
  void testCreateTicketNoAuth() {

    TicketDto ticket =
        TicketDto.builder()
            .createdBy("cgillespie")
            .title("A test ticket")
            .description("This is a test description")
            .labels(null)
            .state(null)
            .ticketType(null)
            .created(Instant.now())
            .build();

    withBadAuth()
        .contentType(ContentType.JSON)
        .when()
        .body(ticket)
        .post(this.getSnomioLocation() + "/api/tickets")
        .then()
        .log()
        .body()
        .statusCode(403);
  }

  @Test
  void testGetUnknownTicket() {
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(this.getSnomioLocation() + "/api/tickets/999999999")
        .then()
        .log()
        .body()
        .statusCode(404);
  }
}
