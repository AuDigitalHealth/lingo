package com.csiro.tickets;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor // Needs for message deserialisation
public class BatchArtgIdMessageDto extends RabbitMessage {
  List<String> artgIds;

  public BatchArtgIdMessageDto(String correlationId, List<String> artgId) {
    super(correlationId); // Initialize the parent class field
    this.artgIds = artgId;
  }
}
