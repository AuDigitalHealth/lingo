package com.csiro.ticket.controllers.dto;


import java.time.Instant;

import com.csiro.ticket.controllers.dto.models.Iteration;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IterationDto {

  private String name;

  private Instant startDate;

  private Instant endDate;

  private boolean active;

  private boolean completed;

  public static IterationDto of(Iteration iteration) {
    if (iteration == null) return new IterationDto();

    return IterationDto.builder()
        .name(iteration.getName())
        .startDate(iteration.getStartDate())
        .endDate(iteration.getEndDate())
        .active(iteration.isActive())
        .completed(iteration.isCompleted())
        .build();
  }
}
