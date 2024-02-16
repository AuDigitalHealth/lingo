package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ResourceAlreadyExists;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
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
                        String.format("Schedule with id %s not found", scheduleId)));

    foundSchedule.setDescription(schedule.getDescription());
    foundSchedule.setGrouping(schedule.getGrouping());

    Schedule updatedSchedule = scheduleRepository.save(foundSchedule);
    return new ResponseEntity<>(updatedSchedule, HttpStatus.OK);
  }

  @DeleteMapping("/{scheduleId}")
  public ResponseEntity<Void> deleteSchedule(@PathVariable Long scheduleId) {
    if (!scheduleRepository.existsById(scheduleId)) {
      throw new ResourceNotFoundProblem(String.format("Schedule with id %s not found", scheduleId));
    }
    scheduleRepository.deleteById(scheduleId);
    return new ResponseEntity<>(HttpStatus.NO_CONTENT);
  }

  @GetMapping("/{scheduleId}")
  public ResponseEntity<Schedule> getSchedule(@PathVariable Long scheduleId) {
    if (!scheduleRepository.existsById(scheduleId)) {
      throw new ResourceNotFoundProblem(String.format("Schedule with id %s not found", scheduleId));
    }
    return new ResponseEntity<Schedule>(
        scheduleRepository.findById(scheduleId).get(), HttpStatus.OK);
  }
}
