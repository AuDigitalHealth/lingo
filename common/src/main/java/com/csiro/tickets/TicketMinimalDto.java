package com.csiro.tickets;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class TicketMinimalDto {

  private Long id;

  private Integer version;

  private Instant created;

  private Instant modified;

  private String createdBy;

  private String modifiedBy;

  private IterationDto iteration;

  private String title;

  private String description;

  private TicketTypeDto ticketType;

  private StateDto state;

  private List<LabelDto> labels;

  private String assignee;

  private PriorityBucketDto priorityBucket;

  private TaskAssociationDto taskAssociation;

  @JsonProperty("ticket-additional-fields")
  private Set<AdditionalFieldValueDto> additionalFieldValues;
}
