package com.csiro.tickets.models.mappers;

import com.csiro.tickets.TicketTypeDto;
import com.csiro.tickets.models.TicketType;

public class TicketTypeMapper {

  private TicketTypeMapper() {
    throw new AssertionError("This class cannot be instantiated");
  }

  public static TicketTypeDto mapToDTO(TicketType ticketType) {
    if (ticketType == null) {
      return null;
    }
    return TicketTypeDto.builder()
        .id(ticketType.getId())
        .name(ticketType.getName())
        .description(ticketType.getDescription())
        .build();
  }

  public static TicketType mapToEntity(TicketTypeDto ticketTypeDto) {
    if (ticketTypeDto == null) {
      return null;
    }
    return TicketType.builder()
        .id(ticketTypeDto.getId())
        .name(ticketTypeDto.getName())
        .description(ticketTypeDto.getDescription())
        .build();
  }
}
