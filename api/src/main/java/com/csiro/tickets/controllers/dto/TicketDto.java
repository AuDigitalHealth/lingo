package com.csiro.tickets.controllers.dto;

import com.csiro.tickets.models.AdditionalFieldTypeValue;
import com.csiro.tickets.models.Iteration;
import com.csiro.tickets.models.Label;
import com.csiro.tickets.models.PriorityBucket;
import com.csiro.tickets.models.State;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketType;
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

  private Iteration iteration;

  private String title;

  private String description;

  private TicketType ticketType;

  private State state;

  private List<Label> labels;

  private String assignee;

  private PriorityBucket priorityBucket;

  private Set<AdditionalFieldTypeValue> additionalFieldTypeValues;

  public static TicketDto of(Ticket ticket) {
    TicketDtoBuilder ticketDto = TicketDto.builder();

    ticketDto
        .id(ticket.getId())
        .version(ticket.getVersion())
        .created(ticket.getCreated())
        .modified(ticket.getModified())
        .createdBy(ticket.getCreatedBy())
        .modifiedBy(ticket.getModifiedBy())
        .iteration(ticket.getIteration())
        .title(ticket.getTitle())
        .description(ticket.getDescription())
        .ticketType(ticket.getTicketType())
        .labels(ticket.getLabels())
        .state(ticket.getState())
        .assignee(ticket.getAssignee())
        .priorityBucket(ticket.getPriorityBucket())
        .additionalFieldTypeValues(ticket.getAdditionalFieldTypeValues());

    return ticketDto.build();
  }
}
