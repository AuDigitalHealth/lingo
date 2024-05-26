package com.csiro.tickets.models.mappers;

import com.csiro.tickets.TaskAssociationDto;
import com.csiro.tickets.models.TaskAssociation;

public class TaskAssociationMapper {

  private TaskAssociationMapper() {
    throw new AssertionError("This class cannot be instantiated");
  }

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

  public static TaskAssociation mapToEntity(TaskAssociationDto taskAssociationDto) {
    if (taskAssociationDto == null) {
      return null;
    }
    return TaskAssociation.builder()
        .id(taskAssociationDto.getId())
        .taskId(taskAssociationDto.getTaskId())
        .build();
  }
}
