package com.csiro.tickets.models.mappers;

import com.csiro.tickets.IterationDto;
import com.csiro.tickets.models.Iteration;

public class IterationMapper {
  public static IterationDto mapToDTO(Iteration iteration) {
    if (iteration == null) return new IterationDto();

    return IterationDto.builder()
        .name(iteration.getName())
        .startDate(iteration.getStartDate())
        .endDate(iteration.getEndDate())
        .active(iteration.isActive())
        .completed(iteration.isCompleted())
        .build();
  }

  public static Iteration mapToEntity(IterationDto iterationDto) {
    if (iterationDto == null) return null;

    return Iteration.builder()
        .name(iterationDto.getName())
        .startDate(iterationDto.getStartDate())
        .endDate(iterationDto.getEndDate())
        .active(iterationDto.isActive())
        .completed(iterationDto.isCompleted())
        .build();
  }
}
