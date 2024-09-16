package com.csiro.tickets;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
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

  private Instant created;

  private String assignee;

  private String title;

  private String description;

  private TicketTypeDto ticketType;

  private StateDto state;

  private ScheduleDto schedule;

  @JsonProperty(value = "labels")
  private Set<LabelDto> labels;

  @JsonProperty(value = "externalRequestors")
  private Set<ExternalRequesterDto> externalRequestors;

  @JsonProperty(value = "ticket-comment")
  private List<CommentDto> comments;

  @JsonProperty(value = "ticket-additional-fields")
  private Set<AdditionalFieldValueDto> additionalFieldValues;

  @JsonProperty(value = "ticket-attachment")
  private List<AttachmentDto> attachments;
}
