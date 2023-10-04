package com.csiro.tickets.controllers.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class TaskAssociationDto {

  private Long id;

  private Long ticketId;

  private String taskId;
}
