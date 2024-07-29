package com.csiro.tickets;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor // Needs for message deserialisation
public class RabbitMessage {
  String correlationId;
}
