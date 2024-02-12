package com.csiro.tickets.models.mappers;

import com.csiro.tickets.ScheduleDto;
import com.csiro.tickets.models.Schedule;

public class ScheduleMapper {

  private ScheduleMapper() {
    throw new AssertionError("This class cannot be instantiated");
  }

  public static ScheduleDto mapToDTO(Schedule schedule) {
    if (schedule == null) {
      return null;
    }
    return ScheduleDto.builder()
        .id(schedule.getId())
        .name(schedule.getName())
        .description(schedule.getDescription())
        .grouping(schedule.getGrouping())
        .build();
  }

  public static Schedule mapToEntity(ScheduleDto scheduleDto) {
    if (scheduleDto == null) {
      return null;
    }
    return Schedule.builder()
        .id(scheduleDto.getId())
        .name(scheduleDto.getName())
        .description(scheduleDto.getDescription())
        .grouping(scheduleDto.getGrouping())
        .build();
  }
}
