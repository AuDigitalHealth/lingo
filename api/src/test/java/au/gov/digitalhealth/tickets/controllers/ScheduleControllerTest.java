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

import au.gov.digitalhealth.tickets.TicketTestBaseLocal;
import au.gov.digitalhealth.tickets.models.Schedule;
import au.gov.digitalhealth.tickets.repository.ScheduleRepository;
import io.restassured.common.mapper.TypeRef;
import io.restassured.http.ContentType;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class ScheduleControllerTest extends TicketTestBaseLocal {

  static final String NEWSCHED = "S1000TEST";
  static final String NEWSCHED_DESC = "This is a Test Schedule";
  @Autowired ScheduleRepository scheduleRepository;

  @BeforeEach
  void clean() {
    deleteTestScheduleIfExists(NEWSCHED);
  }

  @Test
  void testListSchedules() {
    List<Schedule> allSchedules = scheduleRepository.findAll();
    List<Schedule> schedules =
        withAuth()
            .when()
            .get(this.getSnomioLocation() + "/api/tickets/schedules")
            .then()
            .statusCode(200)
            .extract()
            .as(new TypeRef<List<Schedule>>() {});

    schedules.forEach(System.out::println);
    Assertions.assertEquals(allSchedules.size(), schedules.size());
  }

  @Test
  void testCreateSchedule() {
    Schedule schedule = createTestSchedule(NEWSCHED, NEWSCHED_DESC);
    Assertions.assertEquals(NEWSCHED, schedule.getName());
    Assertions.assertEquals(NEWSCHED_DESC, schedule.getDescription());
    Assertions.assertEquals(100, schedule.getGrouping());
  }

  @Test
  void testUpdateSchedule() {
    Schedule schedule = createTestSchedule(NEWSCHED, NEWSCHED_DESC);
    schedule.setDescription(NEWSCHED_DESC + "- Updated");
    schedule.setGrouping(101);
    schedule.setName(NEWSCHED + "- Updated");
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .body(schedule)
        .put(this.getSnomioLocation() + "/api/tickets/schedules/" + schedule.getId())
        .then()
        .log()
        .body()
        .statusCode(400);

    schedule.setName(NEWSCHED);
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
            .log()
            .body()
            .extract()
            .as(Schedule.class);
    Assertions.assertEquals(schedule.getDescription(), updatedScheduleFromGet.getDescription());
    Assertions.assertEquals(schedule.getGrouping(), updatedScheduleFromGet.getGrouping());
    Assertions.assertEquals(schedule.getDescription(), updatedSchedule.getDescription());
    Assertions.assertEquals(schedule.getGrouping(), updatedSchedule.getGrouping());
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
  void testGetSchedule() {
    Schedule schedule = createTestSchedule(NEWSCHED, NEWSCHED_DESC);
    Schedule scheduleFromGet =
        withAuth()
            .when()
            .get(this.getSnomioLocation() + "/api/tickets/schedules/" + schedule.getId())
            .then()
            .statusCode(200)
            .extract()
            .as(Schedule.class);
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

  private void deleteTestScheduleIfExists(String name) {
    scheduleRepository.findByName(name).ifPresent(value -> scheduleRepository.delete(value));
  }
}
