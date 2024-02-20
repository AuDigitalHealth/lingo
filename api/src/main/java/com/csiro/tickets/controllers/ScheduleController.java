package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ResourceAlreadyExists;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.snomio.exception.SnomioProblem;
import com.csiro.tickets.models.Schedule;
import com.csiro.tickets.repository.ScheduleRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets/schedules")
public class ScheduleController {

  private static final String SCHEDULE_WITH_ID_S_NOT_FOUND = "Schedule with id %s not found";
  private final ScheduleRepository scheduleRepository;

  @Autowired
  public ScheduleController(ScheduleRepository scheduleRepository) {
    this.scheduleRepository = scheduleRepository;
  }

  @GetMapping
  public ResponseEntity<List<Schedule>> getAllSchedules() {
    List<Schedule> schedules = scheduleRepository.findAll();
    return new ResponseEntity<>(schedules, HttpStatus.OK);
  }

  @Transactional
  @PostMapping
  public ResponseEntity<Schedule> createSchedule(@RequestBody Schedule schedule) {
    String scheduleName = schedule.getName();
    Optional<Schedule> scheduleOptional = scheduleRepository.findByName(scheduleName);
    if (scheduleOptional.isPresent()) {
      throw new ResourceAlreadyExists(
          String.format("Schedule with name %s already exists", scheduleName));
    }
    Schedule scheduleToAdd =
        Schedule.builder()
            .name(schedule.getName())
            .description(schedule.getDescription())
            .grouping(schedule.getGrouping())
            .build();
    scheduleRepository.save(scheduleToAdd);
    return new ResponseEntity<>(scheduleToAdd, HttpStatus.CREATED);
  }

  // NITE: Schedule name cannot be updated as it is a primary key
  @Transactional
  @PutMapping("/{scheduleId}")
  public ResponseEntity<Schedule> updateSchedule(
      @PathVariable Long scheduleId, @RequestBody Schedule schedule) {
    Schedule foundSchedule =
        scheduleRepository
            .findById(scheduleId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(SCHEDULE_WITH_ID_S_NOT_FOUND, scheduleId)));

    if (!schedule.getName().equals(foundSchedule.getName())) {
      throw new SnomioProblem(
          "schedule-update-error",
          "Cannot update Schedule name to "
              + schedule.getName()
              + " - existing name: "
              + foundSchedule.getName(),
          HttpStatus.BAD_REQUEST,
          "Schedule name cannot be updated as it is a primary key. Please create a new Schedule for this update and delete the existing one.");
    }
    try {
      Schedule updatedSchedule = new Schedule();
      foundSchedule.setDescription(schedule.getDescription());
      foundSchedule.setGrouping(schedule.getGrouping());
      updatedSchedule = scheduleRepository.saveAndFlush(foundSchedule);
      return new ResponseEntity<>(updatedSchedule, HttpStatus.OK);
    } catch (Exception e) {
      throw new SnomioProblem(
          "schedule-update-error",
          "Could not update schedule error during saving of the entity.",
          HttpStatus.INTERNAL_SERVER_ERROR,
          e.getMessage());
    }
  }

  @Transactional
  @DeleteMapping("/{scheduleId}")
  public ResponseEntity<Void> deleteSchedule(@PathVariable Long scheduleId) {
    if (!scheduleRepository.existsById(scheduleId)) {
      throw new ResourceNotFoundProblem(String.format(SCHEDULE_WITH_ID_S_NOT_FOUND, scheduleId));
    }
    scheduleRepository.deleteById(scheduleId);
    return new ResponseEntity<>(HttpStatus.NO_CONTENT);
  }

  @GetMapping("/{scheduleId}")
  public ResponseEntity<Schedule> getSchedule(@PathVariable Long scheduleId) {
    return new ResponseEntity<Schedule>(
        scheduleRepository
            .findById(scheduleId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format(SCHEDULE_WITH_ID_S_NOT_FOUND, scheduleId))),
        HttpStatus.OK);
  }
}
