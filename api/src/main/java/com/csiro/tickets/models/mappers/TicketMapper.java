package com.csiro.tickets.models.mappers;

import com.csiro.tickets.AssociationTicketDto;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.controllers.dto.TicketDto.TicketDtoBuilder;
import com.csiro.tickets.controllers.dto.TicketImportDto;
import com.csiro.tickets.models.ExternalRequestor;
import com.csiro.tickets.models.Label;
import com.csiro.tickets.models.Schedule;
import com.csiro.tickets.models.Ticket;
import java.util.Arrays;
import java.util.stream.Collectors;

public class TicketMapper {

  private TicketMapper() {
    throw new AssertionError("This class cannot be instantiated");
  }

  public static TicketDto mapToDTO(Ticket ticket) {
    TicketDtoBuilder ticketDto = TicketDto.builder();

    ticketDto
        .products(ProductMapper.mapToDto(ticket.getProducts()))
        .id(ticket.getId())
        .version(ticket.getVersion())
        .created(ticket.getCreated())
        .modified(ticket.getModified())
        .createdBy(ticket.getCreatedBy())
        .modifiedBy(ticket.getModifiedBy())
        .iteration(IterationMapper.mapToDTO(ticket.getIteration()))
        .title(ticket.getTitle())
        .schedule(ScheduleMapper.mapToDTO(ticket.getSchedule()))
        .description(ticket.getDescription())
        .ticketType(TicketTypeMapper.mapToDTO(ticket.getTicketType()))
        .labels(LabelMapper.mapToDtoList(ticket.getLabels()))
        .externalRequestors(ExternalRequestorMapper.mapToDtoList(ticket.getExternalRequestors()))
        .state(StateMapper.mapToDTO(ticket.getState()))
        .assignee(ticket.getAssignee())
        .priorityBucket(PriorityBucketMapper.mapToDTO(ticket.getPriorityBucket()))
        .taskAssociation(TaskAssociationMapper.mapToDTO(ticket.getTaskAssociation()))
        .ticketSourceAssociations(
            TicketAssociationMapper.mapToDtoList(ticket.getTicketSourceAssociations()))
        .ticketTargetAssociations(
            TicketAssociationMapper.mapToDtoList(ticket.getTicketTargetAssociations()))
        // TODO: Instead of this Dto magic (same for State) to get the data
        // filled by TicketRepository findAll() we need to look into changing
        // the findAll() to use JOIN FETCH to get all the fields
        // that are only filled with ids instead of whole resources in the response
        .additionalFieldValues(
            AdditionalFieldValueMapper.mapToDto(ticket.getAdditionalFieldValues()))
        .jsonFields(JsonFieldMapper.mapToDtoList(ticket.getJsonFields()));

    return ticketDto.build();
  }

  public static Ticket mapToEntity(TicketDto ticketDto) {
    Ticket ticket =
        Ticket.builder()
            .id(ticketDto.getId())
            .created(ticketDto.getCreated())
            .createdBy(ticketDto.getCreatedBy())
            .title(ticketDto.getTitle())
            .description(ticketDto.getDescription())
            .ticketType(TicketTypeMapper.mapToEntity(ticketDto.getTicketType()))
            .state(StateMapper.mapToEntity(ticketDto.getState()))
            .schedule(ScheduleMapper.mapToEntity(ticketDto.getSchedule()))
            .assignee(ticketDto.getAssignee())
            .priorityBucket(PriorityBucketMapper.mapToEntity(ticketDto.getPriorityBucket()))
            .labels(LabelMapper.mapToEntityList(ticketDto.getLabels()))
            .externalRequestors(
                ExternalRequestorMapper.mapToEntityList(ticketDto.getExternalRequestors()))
            .iteration(IterationMapper.mapToEntity(ticketDto.getIteration()))
            .additionalFieldValues(
                AdditionalFieldValueMapper.mapToEntity(ticketDto.getAdditionalFieldValues()))
            .jsonFields(JsonFieldMapper.mapToEntityList(ticketDto.getJsonFields()))
            .build();

    if (ticketDto.getProducts() != null) {
      ticket.setProducts(
          ticketDto.getProducts().stream()
              .map(productDto -> ProductMapper.mapToEntity(productDto, ticket))
              .collect(Collectors.toSet()));
    }
    return ticket;
  }

  public static Ticket mapToEntityFromImportDto(TicketImportDto ticketImportDto) {
    // NOTE: Schedule is an array in the export
    // We only get the first element as there should be only one
    // schedule associated with the product.
    // Jira field should really be a string insead
    Schedule schedule = new Schedule();
    if (ticketImportDto.getSchedule() != null && !ticketImportDto.getSchedule().isEmpty()) {
      schedule = ticketImportDto.getSchedule().get(0);
    }
    return Ticket.builder()
        .title(ticketImportDto.getTitle())
        .created(ticketImportDto.getCreated())
        .jiraCreated(ticketImportDto.getCreated())
        .description(ticketImportDto.getDescription())
        .ticketType(ticketImportDto.getTicketType()) // TODO handle external requestors here
        .labels(ticketImportDto.getLabels())
        .externalRequestors(ticketImportDto.getExternalRequestors())
        .assignee(ticketImportDto.getAssignee())
        .comments(ticketImportDto.getComments())
        .additionalFieldValues(ticketImportDto.getAdditionalFieldValues())
        .attachments(ticketImportDto.getAttachments())
        .comments(ticketImportDto.getComments())
        .state(ticketImportDto.getState())
        .schedule(schedule)
        .build();
  }

  public static TicketImportDto mapToImportDto(Ticket ticket) {
    TicketImportDto.TicketImportDtoBuilder ticketImportDto = TicketImportDto.builder();

    ticketImportDto
        .title(ticket.getTitle())
        .description(ticket.getDescription())
        .ticketType(ticket.getTicketType())
        .labels(ticket.getLabels())
        .externalRequestors(ticket.getExternalRequestors())
        .assignee(ticket.getAssignee())
        .comments(ticket.getComments())
        .additionalFieldValues(ticket.getAdditionalFieldValues())
        .attachments(ticket.getAttachments())
        .comments(ticket.getComments())
        .state(ticket.getState())
        .schedule(Arrays.asList(ticket.getSchedule()));

    return ticketImportDto.build();
  }

  public static AssociationTicketDto mapToAssociationTicketDto(Ticket ticket) {
    if (ticket == null) {
      return null;
    }
    return AssociationTicketDto.builder()
        .id(ticket.getId())
        .title(ticket.getTitle())
        .description(ticket.getDescription())
        .state(StateMapper.mapToDTO(ticket.getState()))
        .build();
  }

  public static ExternalRequestor mapToExternalRequestor(Label label) {
    return ExternalRequestor.builder()
        .name(label.getName())
        .description(label.getDescription())
        .displayColor(label.getDisplayColor())
        .build();
  }
}
