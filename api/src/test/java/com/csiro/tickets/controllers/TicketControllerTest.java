package com.csiro.tickets.controllers;

import static org.hamcrest.Matchers.is;

import com.csiro.tickets.TicketTestBaseLocal;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.models.*;
import com.csiro.tickets.repository.*;
import io.restassured.http.ContentType;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ProblemDetail;

class TicketControllerTest extends TicketTestBaseLocal {

  @Autowired private LabelRepository labelRepository;

  @Autowired private ExternalRequestorRepository externalRequestorRepository;

  @Autowired private StateRepository stateRepository;

  @Autowired private PriorityBucketRepository priorityBucketRepository;

  @Autowired private IterationRepository iterationRepository;

  @Autowired private TicketTypeRepository ticketTypeRepository;

  @Autowired private ScheduleRepository scheduleRepository;
  protected final Log logger = LogFactory.getLog(getClass());

  static final String NEWSCHED = "S1000TEST";
  static final String NEWSCHED_DESC = "This is a Test Schedule";
  static final String TICKET_TITLE = "A test ticket";
  static final String TICKET_DESC = "This is a test description";

  @Test
  void testCreateTicket() {
    Ticket createdTicket = createTicket();
    Assertions.assertEquals(TICKET_TITLE, createdTicket.getTitle());
    Assertions.assertEquals(TICKET_DESC, createdTicket.getDescription());
  }

  private Ticket createTicket() {
    TicketDto ticket =
        TicketDto.builder()
            .createdBy("cgillespie")
            .title(TICKET_TITLE)
            .description(TICKET_DESC)
            .labels(null)
            .externalRequestors(null)
            .state(null)
            .ticketType(null)
            .created(Instant.now())
            .build();

    return withAuth()
        .contentType(ContentType.JSON)
        .when()
        .body(ticket)
        .post(this.getSnomioLocation() + "/api/tickets")
        .then()
        .statusCode(200)
        .extract()
        .as(Ticket.class);
  }

  @Test
  void testCreateTicketComplex() {
    List<Label> startAllLabels = labelRepository.findAll();
    List<ExternalRequestor> startAllExternalRequestors = externalRequestorRepository.findAll();
    List<State> startAllStates = stateRepository.findAll();
    List<PriorityBucket> startAllPriorities = priorityBucketRepository.findAll();
    List<Iteration> startAllIterations = iterationRepository.findAll();
    List<TicketType> startAllTicketTypes = ticketTypeRepository.findAll();

    Optional<TicketType> ticketType =
        ticketTypeRepository.findById(startAllTicketTypes.get(0).getId());
    Optional<Label> label = labelRepository.findById(startAllLabels.get(0).getId());
    List<Label> labelList = new ArrayList<>();
    labelList.add(label.orElseThrow());
    List<ExternalRequestor> externalRequestorList = new ArrayList<>();
    if (startAllExternalRequestors.size()
        < 1) { // handle test failures before the ticket import process
      ExternalRequestor newExternalRequestor =
          ExternalRequestor.builder()
              .name("Test-external-requestor")
              .description("Test-external-requestor")
              .displayColor("info")
              .ticket(new ArrayList<>())
              .build();
      externalRequestorRepository.save(newExternalRequestor);
      startAllExternalRequestors = externalRequestorRepository.findAll();
      externalRequestorList.add(newExternalRequestor);
    } else {
      Optional<ExternalRequestor> externalRequestor =
          externalRequestorRepository.findById(startAllExternalRequestors.get(0).getId());

      externalRequestorList.add(externalRequestor.orElseThrow());
    }

    Optional<State> state = stateRepository.findById(startAllStates.get(0).getId());
    Optional<PriorityBucket> priorityBucket =
        priorityBucketRepository.findById(startAllPriorities.get(0).getId());
    Optional<Iteration> iteration = iterationRepository.findById(startAllIterations.get(0).getId());

    Ticket ticket =
        Ticket.builder()
            .title("Complex")
            .description("ticket")
            .labels(labelList)
            .externalRequestors(externalRequestorList)
            .state(state.orElseThrow())
            .ticketType(ticketType.orElseThrow())
            .priorityBucket(priorityBucket.orElseThrow())
            .iteration(iteration.orElseThrow())
            .build();

    Ticket ticketResponse =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(ticket)
            .post(this.getSnomioLocation() + "/api/tickets")
            .then()
            .statusCode(200)
            .extract()
            .as(Ticket.class);

    List<Label> responseLabels = ticketResponse.getLabels();
    List<ExternalRequestor> responseExternalRequestors = ticketResponse.getExternalRequestors();

    PriorityBucket responseBuckets = ticketResponse.getPriorityBucket();
    State responseState = ticketResponse.getState();
    Iteration responseIteration = ticketResponse.getIteration();

    Assertions.assertEquals(responseLabels.get(0).getId(), labelList.get(0).getId());
    Assertions.assertEquals(
        responseExternalRequestors.get(0).getId(), externalRequestorList.get(0).getId());
    Assertions.assertEquals(responseBuckets.getName(), priorityBucket.get().getName());
    Assertions.assertEquals(responseState.getId(), state.get().getId());
    Assertions.assertEquals(responseIteration.getName(), iteration.get().getName());

    List<Label> endAllLabels = labelRepository.findAll();
    List<ExternalRequestor> endAllExternalRequestors = externalRequestorRepository.findAll();
    List<State> endAllStates = stateRepository.findAll();
    List<PriorityBucket> endAllPriorities = priorityBucketRepository.findAll();
    List<Iteration> endAllIterations = iterationRepository.findAll();

    Assertions.assertEquals(startAllLabels.size(), endAllLabels.size());
    Assertions.assertEquals(startAllExternalRequestors.size(), endAllExternalRequestors.size());
    Assertions.assertEquals(startAllStates.size(), endAllStates.size());
    Assertions.assertEquals(startAllPriorities.size(), endAllPriorities.size());
    Assertions.assertEquals(startAllIterations.size(), endAllIterations.size());
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
  @Disabled
  void testSearchTicket() {
    List<Label> startAllLabels = labelRepository.findAll();
    List<State> startAllStates = stateRepository.findAll();
    List<PriorityBucket> startAllPriorities = priorityBucketRepository.findAll();
    List<Iteration> startAllIterations = iterationRepository.findAll();

    createTicket(startAllLabels, startAllStates, startAllPriorities, startAllIterations);
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

  private Ticket createTicket(
      List<Label> startAllLabels,
      List<State> startAllStates,
      List<PriorityBucket> startAllPriorities,
      List<Iteration> startAllIterations) {
    List<TicketType> startAllTicketTypes = ticketTypeRepository.findAll();

    Optional<TicketType> ticketType =
        ticketTypeRepository.findById(startAllTicketTypes.get(0).getId());
    Optional<Label> label = labelRepository.findById(startAllLabels.get(0).getId());
    List<Label> labelList = new ArrayList<>();
    labelList.add(label.orElseThrow());
    Optional<State> state = stateRepository.findById(startAllStates.get(0).getId());
    Optional<PriorityBucket> priorityBucket =
        priorityBucketRepository.findById(startAllPriorities.get(0).getId());
    Optional<Iteration> iteration = iterationRepository.findById(startAllIterations.get(0).getId());

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

    Ticket ticketResponse =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(ticket)
            .post(this.getSnomioLocation() + "/api/tickets")
            .then()
            .statusCode(200)
            .extract()
            .as(Ticket.class);

    return ticketResponse;
  }

  @Test
  void testUpdatedTicketSchedule() {
    Ticket createdTicket = createTicket();
    Schedule schedule = createTestSchedule(NEWSCHED, NEWSCHED_DESC);
    withAuth()
        .when()
        .put(
            this.getSnomioLocation()
                + "/api/tickets/"
                + createdTicket.getId()
                + "/schedule/"
                + schedule.getId())
        .then()
        .statusCode(200);
    Ticket updatedTicket =
        withAuth()
            .when()
            .get(this.getSnomioLocation() + "/api/tickets/" + createdTicket.getId())
            .then()
            .statusCode(200)
            .extract()
            .as(Ticket.class);
    Assertions.assertEquals(schedule.getId(), updatedTicket.getSchedule().getId());
    Assertions.assertEquals(NEWSCHED, updatedTicket.getSchedule().getName());
    Assertions.assertEquals(NEWSCHED_DESC, updatedTicket.getSchedule().getDescription());
    Assertions.assertEquals(100, updatedTicket.getSchedule().getGrouping());
  }

  @Test
  void testDeleteTicketSchedule() {
    Ticket createdTicket = createTicket();
    Schedule schedule = createTestSchedule(NEWSCHED, NEWSCHED_DESC);
    withAuth()
        .when()
        .put(
            this.getSnomioLocation()
                + "/api/tickets/"
                + createdTicket.getId()
                + "/schedule/"
                + schedule.getId())
        .then()
        .statusCode(200);
    Ticket updatedTicket =
        withAuth()
            .when()
            .get(this.getSnomioLocation() + "/api/tickets/" + createdTicket.getId())
            .then()
            .statusCode(200)
            .extract()
            .as(Ticket.class);
    Assertions.assertEquals(schedule.getId(), updatedTicket.getSchedule().getId());
    withAuth()
        .when()
        .delete(this.getSnomioLocation() + "/api/tickets/" + createdTicket.getId() + "/schedule")
        .then()
        .statusCode(204);
    Ticket updatedTicket2 =
        withAuth()
            .when()
            .get(this.getSnomioLocation() + "/api/tickets/" + createdTicket.getId())
            .then()
            .statusCode(200)
            .extract()
            .as(Ticket.class);
    Assertions.assertEquals(null, updatedTicket2.getSchedule());
  }

  private Schedule createTestSchedule(String name, String description) {
    Optional<Schedule> schedule = scheduleRepository.findByName(name);
    if (schedule.isPresent()) {
      return schedule.get();
    }
    Schedule sched = Schedule.builder().name(name).description(description).grouping(100).build();
    return withAuth()
        .contentType(ContentType.JSON)
        .when()
        .body(sched)
        .post(this.getSnomioLocation() + "/api/tickets/schedules")
        .then()
        .statusCode(201)
        .extract()
        .as(Schedule.class);
  }
}
