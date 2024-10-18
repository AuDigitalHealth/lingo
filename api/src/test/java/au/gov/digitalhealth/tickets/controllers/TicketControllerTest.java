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
package au.gov.digitalhealth.tickets.controllers;

import static org.hamcrest.Matchers.is;

import au.gov.digitalhealth.tickets.TicketDto;
import au.gov.digitalhealth.tickets.TicketTestBaseLocal;
import au.gov.digitalhealth.tickets.models.ExternalRequestor;
import au.gov.digitalhealth.tickets.models.Iteration;
import au.gov.digitalhealth.tickets.models.Label;
import au.gov.digitalhealth.tickets.models.PriorityBucket;
import au.gov.digitalhealth.tickets.models.Schedule;
import au.gov.digitalhealth.tickets.models.State;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.models.TicketType;
import au.gov.digitalhealth.tickets.repository.ExternalRequestorRepository;
import au.gov.digitalhealth.tickets.repository.IterationRepository;
import au.gov.digitalhealth.tickets.repository.LabelRepository;
import au.gov.digitalhealth.tickets.repository.PriorityBucketRepository;
import au.gov.digitalhealth.tickets.repository.ScheduleRepository;
import au.gov.digitalhealth.tickets.repository.StateRepository;
import au.gov.digitalhealth.tickets.repository.TicketTypeRepository;
import io.restassured.http.ContentType;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ProblemDetail;

class TicketControllerTest extends TicketTestBaseLocal {

  static final String NEWSCHED = "S1000TEST";
  static final String NEWSCHED_DESC = "This is a Test Schedule";
  static final String TICKET_TITLE = "A test ticket";
  static final String TICKET_DESC = "This is a test description";

  @Autowired private LabelRepository labelRepository;
  @Autowired private ExternalRequestorRepository externalRequestorRepository;
  @Autowired private StateRepository stateRepository;
  @Autowired private PriorityBucketRepository priorityBucketRepository;
  @Autowired private IterationRepository iterationRepository;
  @Autowired private TicketTypeRepository ticketTypeRepository;
  @Autowired private ScheduleRepository scheduleRepository;

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
    Set<Label> labelList = new HashSet<>();
    labelList.add(label.orElseThrow());
    Set<ExternalRequestor> externalRequestorList = new HashSet<>();
    if (startAllExternalRequestors
        .isEmpty()) { // handle test failures before the ticket import process
      ExternalRequestor newExternalRequestor =
          ExternalRequestor.builder()
              .name("Test-external-requestor")
              .description("Test-external-requestor")
              .displayColor("info")
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

    Set<Label> responseLabels = ticketResponse.getLabels();
    Set<ExternalRequestor> responseExternalRequestors = ticketResponse.getExternalRequestors();

    PriorityBucket responseBuckets = ticketResponse.getPriorityBucket();
    State responseState = ticketResponse.getState();
    Iteration responseIteration = ticketResponse.getIteration();

    Assertions.assertEquals(
        responseLabels.iterator().next().getId(), labelList.iterator().next().getId());
    Assertions.assertEquals(
        responseExternalRequestors.iterator().next().getName(),
        externalRequestorList.iterator().next().getName());
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
        "http://lingo.csiro.au/problem/access-denied", problemDetail.getType().toString());
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
    Assertions.assertEquals("Ticket with ID 999999999 not found", problemDetail.getDetail());
    Assertions.assertEquals(
        "http://lingo.csiro.au/problem/resource-not-found", problemDetail.getType().toString());
    Assertions.assertEquals(404, problemDetail.getStatus());
  }

  @Test
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
        .body("page.totalElements", is(2));

    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(this.getSnomioLocation() + "/api/tickets/search?ticketType.name=TestFailure")
        .then()
        .statusCode(200)
        .body("page.totalElements", is(2));

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
    Set<Label> labelList = new HashSet<>();
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
    Assertions.assertNull(updatedTicket2.getSchedule());
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
