package com.csiro.tickets.models.mappers;

import com.csiro.tickets.TaskAssociationDto;
import com.csiro.tickets.models.TaskAssociation;

public class TaskAssociationMapper {

  public static TaskAssociationDto mapToDTO(TaskAssociation taskAssociation) {
    if (taskAssociation == null) {
      return null;
    }
    return TaskAssociationDto.builder()
        .id(taskAssociation.getId())
        .ticketId(taskAssociation.getTicket().getId())
        .taskId(taskAssociation.getTaskId())
        .build();
  }
}
