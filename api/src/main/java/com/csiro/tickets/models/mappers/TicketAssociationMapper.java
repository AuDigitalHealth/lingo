package com.csiro.tickets.models.mappers;

import com.csiro.tickets.TicketAssociationDto;
import com.csiro.tickets.models.TicketAssociation;

public class TicketAssociationMapper {

  private TicketAssociationMapper() {
    throw new AssertionError("This class cannot be instantiated");
  }

  public static TicketAssociationDto mapToDTO(TicketAssociation ticketAssociation) {
    if (ticketAssociation == null) {
      return null;
    }
    return TicketAssociationDto.builder()
        .id(ticketAssociation.getId())
        .associationSource(TicketMapper.mapToDTO(ticketAssociation.getAssociationSource()))
        .associationTarget(TicketMapper.mapToDTO(ticketAssociation.getAssociationTarget()))
        .build();
  }
}
