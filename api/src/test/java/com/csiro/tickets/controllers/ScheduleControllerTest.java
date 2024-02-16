package com.csiro.tickets.controllers;

import com.csiro.tickets.TicketTestBaseLocal;
import com.csiro.tickets.models.Schedule;
import com.csiro.tickets.repository.LabelRepository;
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
    Schedule schedule = createTestSchedule();
    Assertions.assertEquals(NEWSCHED, schedule.getName());
    Assertions.assertEquals(NEWSCHED_DESC, schedule.getDescription());
    Assertions.assertEquals(100, schedule.getGrouping());
  }

  @Test
  void testUpdateSchedule() {
    Schedule schedule = createTestSchedule();
    schedule.setName(NEWSCHED + "- Updated");
    schedule.setDescription(NEWSCHED_DESC + "- Updated");
    schedule.setGrouping(101);

    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .body(schedule)
        .put(this.getSnomioLocation() + "/api/tickets/schedules/" + schedule.getId())
        .then()
        .statusCode(200)
        .extract()
        .as(Schedule.class);

    schedule =
        withAuth()
            .when()
            .get(this.getSnomioLocation() + "/api/tickets/schedules/" + schedule.getId())
            .then()
            .statusCode(200)
            .extract()
            .as(Schedule.class);
    Assertions.assertEquals(NEWSCHED + "- Updated", schedule.getName());
    Assertions.assertEquals(NEWSCHED_DESC + "- Updated", schedule.getDescription());
    Assertions.assertEquals(101, schedule.getGrouping());
  }

  @Test
  void testDeleteAndGetSchedule() {
    Schedule schedule = createTestSchedule();

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

  private Schedule createTestSchedule() {
    Schedule sched =
        Schedule.builder().name(NEWSCHED).description(NEWSCHED_DESC).grouping(100).build();
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
