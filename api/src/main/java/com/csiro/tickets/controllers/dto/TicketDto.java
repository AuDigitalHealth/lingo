package com.csiro.tickets.controllers.dto;

import com.csiro.tickets.models.Label;
import com.csiro.tickets.models.TaskAssociation;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketType;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TicketDto {

  private Long id;

  private Integer version;

  private Instant created;

  private Instant modified;

  private String createdBy;

  private String modifiedBy;

  private IterationDto iteration;

  private String title;

  private String description;

  private TicketType ticketType;

  private StateDto state;

  private List<Label> labels;

  private String assignee;

  private PriorityBucketDto priorityBucket;

  private Set<ProductDto> products;

  private TaskAssociation taskAssociation;

  @JsonProperty("ticket-additional-fields")
  private Set<AdditionalFieldValueDto> additionalFieldValues;

  public static TicketDto of(Ticket ticket) {
    TicketDtoBuilder ticketDto = TicketDto.builder();

    ticketDto
        .id(ticket.getId())
        .version(ticket.getVersion())
        .created(ticket.getCreated())
        .modified(ticket.getModified())
        .createdBy(ticket.getCreatedBy())
        .modifiedBy(ticket.getModifiedBy())
        .iteration(IterationDto.of(ticket.getIteration()))
        .title(ticket.getTitle())
        .description(ticket.getDescription())
        .ticketType(ticket.getTicketType())
        .labels(ticket.getLabels())
        .state(StateDto.of(ticket.getState()))
        .assignee(ticket.getAssignee())
        .priorityBucket(PriorityBucketDto.of(ticket.getPriorityBucket()))
        .taskAssociation(ticket.getTaskAssociation())
        // TODO: Instead of this Dto magic (same for State) to get the data
        // filled by TicketRepository findAll() we need to look into changing
        // the findAll() to use JOIN FETCH to get all the fields
        // that are only filled with ids instead of whole resources in the response
        .additionalFieldValues(AdditionalFieldValueDto.of(ticket.getAdditionalFieldValues()))
        .products(ProductDto.of(ticket.getProducts()));

    return ticketDto.build();
  }
}
