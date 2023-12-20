package com.csiro.tickets.models.mappers;

import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.controllers.dto.TicketDto.TicketDtoBuilder;
import com.csiro.tickets.controllers.dto.TicketImportDto;
import com.csiro.tickets.models.Ticket;
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
        .description(ticket.getDescription())
        .ticketType(TicketTypeMapper.mapToDTO(ticket.getTicketType()))
        .labels(LabelMapper.mapToDtoList(ticket.getLabels()))
        .state(StateMapper.mapToDTO(ticket.getState()))
        .assignee(ticket.getAssignee())
        .priorityBucket(PriorityBucketMapper.mapToDTO(ticket.getPriorityBucket()))
        .taskAssociation(TaskAssociationMapper.mapToDTO(ticket.getTaskAssociation()))
        // TODO: Instead of this Dto magic (same for State) to get the data
        // filled by TicketRepository findAll() we need to look into changing
        // the findAll() to use JOIN FETCH to get all the fields
        // that are only filled with ids instead of whole resources in the response
        .additionalFieldValues(
            AdditionalFieldValueMapper.mapToDto(ticket.getAdditionalFieldValues()));

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
            .assignee(ticketDto.getAssignee())
            .priorityBucket(PriorityBucketMapper.mapToEntity(ticketDto.getPriorityBucket()))
            .labels(LabelMapper.mapToEntityList(ticketDto.getLabels()))
            .iteration(IterationMapper.mapToEntity(ticketDto.getIteration()))
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
    return Ticket.builder()
        .title(ticketImportDto.getTitle())
        .description(ticketImportDto.getDescription())
        .ticketType(ticketImportDto.getTicketType())
        .labels(ticketImportDto.getLabels())
        .assignee(ticketImportDto.getAssignee())
        .comments(ticketImportDto.getComments())
        .additionalFieldValues(ticketImportDto.getAdditionalFieldValues())
        .attachments(ticketImportDto.getAttachments())
        .comments(ticketImportDto.getComments())
        .state(ticketImportDto.getState())
        .build();
  }

  public static TicketImportDto mapToImportDto(Ticket ticket) {
    TicketImportDto.TicketImportDtoBuilder ticketImportDto = TicketImportDto.builder();

    ticketImportDto
        .title(ticket.getTitle())
        .description(ticket.getDescription())
        .ticketType(ticket.getTicketType())
        .labels(ticket.getLabels())
        .assignee(ticket.getAssignee())
        .comments(ticket.getComments())
        .additionalFieldValues(ticket.getAdditionalFieldValues())
        .attachments(ticket.getAttachments())
        .comments(ticket.getComments())
        .state(ticket.getState());

    return ticketImportDto.build();
  }
}
