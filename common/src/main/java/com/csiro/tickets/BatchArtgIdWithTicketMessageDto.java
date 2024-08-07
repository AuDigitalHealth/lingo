package com.csiro.tickets;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor // Needs for message deserialisation
public class BatchArtgIdWithTicketMessageDto extends RabbitMessage {
  String artgId;
  List<TicketMinimalDto> tickets;

  public BatchArtgIdWithTicketMessageDto(
      String correlationId, String artgId, List<TicketMinimalDto> tickets) {
    super(correlationId);
    this.artgId = artgId;
    this.tickets = tickets;
  }
}
