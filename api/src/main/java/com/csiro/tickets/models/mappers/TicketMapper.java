package com.csiro.tickets.models.mappers;

import com.csiro.tickets.controllers.dto.ProductDto;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.controllers.dto.TicketDto.TicketDtoBuilder;
import com.csiro.tickets.models.Product;
import com.csiro.tickets.models.Ticket;
import java.util.stream.Collectors;

public class TicketMapper {

  public static TicketDto mapToDTO(Ticket ticket) {
    TicketDtoBuilder ticketDto = TicketDto.builder();

    ticketDto
        .products(ProductDto.of(ticket.getProducts()))
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
              .map(productDto -> Product.of(productDto, ticket))
              .collect(Collectors.toSet()));
    }
    return ticket;
  }
}
