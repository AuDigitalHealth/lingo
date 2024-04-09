package com.csiro.tickets.models.mappers;

import com.csiro.tickets.TicketAssociationDto;
import com.csiro.tickets.models.TicketAssociation;
import java.util.List;

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
        .associationSource(
            TicketMapper.mapToAssociationTicketDto(ticketAssociation.getAssociationSource()))
        .associationTarget(
            TicketMapper.mapToAssociationTicketDto(ticketAssociation.getAssociationTarget()))
        .build();
  }

  public static List<TicketAssociationDto> mapToDtoList(
      List<TicketAssociation> ticketAssociations) {
    if (ticketAssociations == null) return null;
    return ticketAssociations.stream().map(TicketAssociationMapper::mapToDTO).toList();
  }

}
