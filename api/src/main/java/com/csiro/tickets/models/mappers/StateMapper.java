package com.csiro.tickets.models.mappers;

import com.csiro.tickets.StateDto;
import com.csiro.tickets.models.State;

public class StateMapper {
  public static StateDto mapToDTO(State state) {
    if (state == null) {
      return null;
    }
    return StateDto.builder()
        .id(state.getId())
        .label(state.getLabel())
        .description(state.getDescription())
        .grouping(state.getGrouping())
        .build();
  }

  public static State mapToEntity(StateDto stateDto) {
    if (stateDto == null) {
      return null;
    }
    return State.builder()
        .id(stateDto.getId())
        .label(stateDto.getLabel())
        .description(stateDto.getDescription())
        .grouping(stateDto.getGrouping())
        .build();
  }
}
