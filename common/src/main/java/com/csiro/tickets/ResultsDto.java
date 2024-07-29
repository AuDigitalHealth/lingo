package com.csiro.tickets;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor // Needs for message deserialisation
public class ResultsDto extends RabbitMessage {
  int processedArtgIds;
  int newTickets;
  int updatedTickets;
  int duplicatedTickets;
  int toBeSuspendedTickets;
  String finishedTime;

  public ResultsDto(
      String correlationId,
      int processedArtgIds,
      int newTickets,
      int updatedTickets,
      int duplicatedTickets,
      int toBeSuspendedTickets,
      String finishedTime) {
    super(correlationId); // Initialize the parent class field
    this.processedArtgIds = processedArtgIds;
    this.newTickets = newTickets;
    this.updatedTickets = updatedTickets;
    this.duplicatedTickets = duplicatedTickets;
    this.toBeSuspendedTickets = toBeSuspendedTickets;
    this.finishedTime = finishedTime;
  }
}
