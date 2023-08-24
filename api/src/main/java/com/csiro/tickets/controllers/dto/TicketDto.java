package com.csiro.tickets.controllers.dto;

import com.csiro.tickets.models.State;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketType;
import java.time.Instant;
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

  private String title;

  private String description;

  private TicketType ticketType;

  private State state;

  public static TicketDto of(Ticket ticket) {
    return TicketDto.builder()
        .id(ticket.getId())
        .version(ticket.getVersion())
        .created(ticket.getCreated())
        .modified(ticket.getModified())
        .createdBy(ticket.getCreatedBy())
        .modifiedBy(ticket.getModifiedBy())
        .title(ticket.getTitle())
        .description(ticket.getDescription())
        .ticketType(ticket.getTicketType())
        .build();
  }
}
