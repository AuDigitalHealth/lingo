package com.csiro.tickets.controllers.dto;

import com.csiro.tickets.models.AdditionalFieldValue;
import com.csiro.tickets.models.Attachment;
import com.csiro.tickets.models.Comment;
import com.csiro.tickets.models.Label;
import com.csiro.tickets.models.State;
import com.csiro.tickets.models.TicketType;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TicketImportDto {

  private Long id;

  private String assignee;

  private String title;

  private String description;

  private TicketType ticketType;

  private State state;

  @JsonProperty(value = "labels")
  private List<Label> labels;

  @JsonProperty(value = "ticket-comment")
  private List<Comment> comments;

  @JsonProperty(value = "ticket-additional-fields")
  private Set<AdditionalFieldValue> additionalFieldValues;

  @JsonProperty(value = "ticket-attachment")
  private List<Attachment> attachments;
}
