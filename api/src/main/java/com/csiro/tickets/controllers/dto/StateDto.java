package com.csiro.tickets.controllers.dto;

import com.csiro.tickets.models.State;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StateDto {

  private Long id;

  private String label;

  private String description;

  private Integer grouping;

  public static StateDto of(State state) {
    return StateDto.builder()
        .id(state.getId())
        .label(state.getLabel())
        .description(state.getDescription())
        .grouping(state.getGrouping())
        .build();
  }

}