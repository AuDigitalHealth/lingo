package com.csiro.tickets.controllers;

import com.csiro.tickets.TicketTestBaseLocal;
import com.csiro.tickets.models.Schedule;
import com.csiro.tickets.repository.LabelRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.restassured.http.ContentType;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class ScheduleControllerTest extends TicketTestBaseLocal {

  @Autowired LabelRepository labelRepository;
  static final String NEWSCHED = "S1000TEST";
  static final String NEWSCHED_DESC = "This is a Test Schedule";

  @Test
  void testListSchedules() {
    @SuppressWarnings("unchecked")
    List<Schedule> schedules =
        withAuth()
            .when()
            .get(this.getSnomioLocation() + "/api/tickets/schedules")
            .then()
            .statusCode(200)
            .extract()
            .as(List.class);
    Assertions.assertEquals(12, schedules.size());
  }

  @Test
  void testCreateSchedule() {
    Schedule schedule = createTestSchedule(NEWSCHED, NEWSCHED_DESC);
    Assertions.assertEquals(NEWSCHED, schedule.getName());
    Assertions.assertEquals(NEWSCHED_DESC, schedule.getDescription());
    Assertions.assertEquals(100, schedule.getGrouping());
  }

  @Test
  void testUpdateSchedule() throws JsonProcessingException {
    Schedule schedule = createTestSchedule(NEWSCHED, NEWSCHED_DESC);
    schedule.setDescription(NEWSCHED_DESC + "- Updated");
    schedule.setGrouping(101);
    schedule.setName(NEWSCHED + "- Updated");
    Schedule updatedSchedule =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(schedule)
            .put(this.getSnomioLocation() + "/api/tickets/schedules/" + schedule.getId())
            .then()
            .log()
            .all()
            .statusCode(200)
            .extract()
            .as(Schedule.class);

    Schedule updatedScheduleFromGet =
        withAuth()
            .when()
            .get(this.getSnomioLocation() + "/api/tickets/schedules/" + schedule.getId())
            .then()
            .statusCode(200)
            .extract()
            .as(Schedule.class);
    ObjectMapper objectMapper = new ObjectMapper();
    objectMapper.registerModule(new JavaTimeModule());

    Assertions.assertEquals(
        objectMapper.writeValueAsString(updatedSchedule),
        objectMapper.writeValueAsString(updatedScheduleFromGet));
    Assertions.assertEquals(NEWSCHED_DESC + "- Updated", updatedSchedule.getDescription());
    Assertions.assertEquals(101, updatedSchedule.getGrouping());
  }

  @Test
  void testDeleteSchedule() {
    Schedule schedule = createTestSchedule(NEWSCHED, NEWSCHED_DESC);

    withAuth()
        .when()
        .delete(this.getSnomioLocation() + "/api/tickets/schedules/" + schedule.getId())
        .then()
        .statusCode(204);
    withAuth()
        .when()
        .get(this.getSnomioLocation() + "/api/tickets/schedules/" + schedule.getId())
        .then()
        .statusCode(404);
  }

  @Test
  void testGetSchedule() throws JsonProcessingException {
    Schedule schedule = createTestSchedule(NEWSCHED, NEWSCHED_DESC);
    Schedule scheduleFromGet =
        withAuth()
            .when()
            .get(this.getSnomioLocation() + "/api/tickets/schedules/" + schedule.getId())
            .then()
            .statusCode(200)
            .extract()
            .as(Schedule.class);
    ObjectMapper objectMapper = new ObjectMapper();
    objectMapper.registerModule(new JavaTimeModule());

    Assertions.assertEquals(
        objectMapper.writeValueAsString(schedule),
        objectMapper.writeValueAsString(scheduleFromGet));
    Assertions.assertEquals(NEWSCHED, scheduleFromGet.getName());
    Assertions.assertEquals(NEWSCHED_DESC, scheduleFromGet.getDescription());
    Assertions.assertEquals(100, scheduleFromGet.getGrouping());
    withAuth()
        .when()
        .get(this.getSnomioLocation() + "/api/tickets/schedules/" + schedule.getId() + 100)
        .then()
        .statusCode(404);
  }

  private Schedule createTestSchedule(String name, String description) {
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
