package com.csiro.tickets.controllers;

import static org.hamcrest.Matchers.is;

import com.csiro.tickets.TicketTestBase;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.models.Iteration;
import com.csiro.tickets.models.Label;
import com.csiro.tickets.models.PriorityBucket;
import com.csiro.tickets.models.State;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketType;
import com.csiro.tickets.repository.IterationRepository;
import com.csiro.tickets.repository.LabelRepository;
import com.csiro.tickets.repository.PriorityBucketRepository;
import com.csiro.tickets.repository.StateRepository;
import com.csiro.tickets.repository.TicketTypeRepository;
import io.restassured.http.ContentType;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ProblemDetail;

class TicketControllerTest extends TicketTestBase {

  @Autowired private LabelRepository labelRepository;

  @Autowired private StateRepository stateRepository;

  @Autowired private PriorityBucketRepository priorityBucketRepository;

  @Autowired private IterationRepository iterationRepository;

  @Autowired private TicketTypeRepository ticketTypeRepository;

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
    TicketDto ticketResponse = createTicket();

    List<Label> responseLabels = ticketResponse.getLabels();
    PriorityBucket responseBuckets = ticketResponse.getPriorityBucket();
    State responseState = ticketResponse.getState();
    Iteration responseIteration = ticketResponse.getIteration();

    Assertions.assertEquals(1, responseLabels.get(0).getId());
    Assertions.assertEquals(1, responseBuckets.getId());
    Assertions.assertEquals(1, responseState.getId());
    Assertions.assertEquals(1, responseIteration.getId());

    List<Label> endAllLabels = labelRepository.findAll();
    List<State> endAllStates = stateRepository.findAll();
    List<PriorityBucket> endAllPriorities = priorityBucketRepository.findAll();
    List<Iteration> endAllIterations = iterationRepository.findAll();

    Assertions.assertEquals(endAllLabels.size(), 2);
    Assertions.assertEquals(endAllStates.size(), 6);
    Assertions.assertEquals(endAllPriorities.size(), 3);
    Assertions.assertEquals(endAllIterations.size(), 2);

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

    ProblemDetail problemDetail =
        withBadAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(ticket)
            .post(this.getSnomioLocation() + "/api/tickets")
            .then()
            .extract()
            .as(ProblemDetail.class);

    Assertions.assertEquals("Forbidden", problemDetail.getTitle());
    Assertions.assertEquals("No cookie received", problemDetail.getDetail());
    Assertions.assertEquals(
        "http://snomio.csiro.au/problem/access-denied", problemDetail.getType().toString());
    Assertions.assertEquals(403, problemDetail.getStatus());
  }

  @Test
  void testGetUnknownTicket() {
    ProblemDetail problemDetail =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .get(this.getSnomioLocation() + "/api/tickets/999999999")
            .then()
            .statusCode(404)
            .extract()
            .as(ProblemDetail.class);

    Assertions.assertEquals("Resource Not Found", problemDetail.getTitle());
    Assertions.assertEquals("Ticket with Id 999999999 not found", problemDetail.getDetail());
    Assertions.assertEquals(
        "http://snomio.csiro.au/problem/resource-not-found", problemDetail.getType().toString());
    Assertions.assertEquals(404, problemDetail.getStatus());
  }

  @Test
  void testSearchTicket() {

    createTicket();

    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(this.getSnomioLocation() + "/api/tickets/search?ticketType.name=Test")
        .then()
        .statusCode(200)
        .body("page.totalElements", is(1));

    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(this.getSnomioLocation() + "/api/tickets/search?ticketType.name=TestFailure")
        .then()
        .statusCode(200)
        .body("page.totalElements", is(0));

    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(this.getSnomioLocation() + "/api/tickets/search?title=complex")
        .then()
        .statusCode(200)
        .body("page.totalElements", is(1));
  }

  private TicketDto createTicket() {
    Optional<TicketType> ticketType = ticketTypeRepository.findById(1L);
    Optional<Label> label = labelRepository.findById(1L);
    List<Label> labelList = new ArrayList<>();
    labelList.add(label.orElseThrow());
    Optional<State> state = stateRepository.findById(1L);
    Optional<PriorityBucket> priorityBucket = priorityBucketRepository.findById(1L);
    Optional<Iteration> iteration = iterationRepository.findById(1L);

    Ticket ticket =
        Ticket.builder()
            .title("Complex")
            .description("ticket")
            .labels(labelList)
            .state(state.orElseThrow())
            .ticketType(ticketType.orElseThrow())
            .priorityBucket(priorityBucket.orElseThrow())
            .iteration(iteration.orElseThrow())
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

    return ticketResponse;
  }
}
