package com.csiro.tickets;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketAssociationDto {

  private AssociationTicketDto associationSource;

  private AssociationTicketDto associationTarget;

  private Long id;
}
