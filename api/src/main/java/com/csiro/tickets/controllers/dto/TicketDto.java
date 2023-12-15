package com.csiro.tickets.controllers.dto;

import com.csiro.tickets.AdditionalFieldValueDto;
import com.csiro.tickets.IterationDto;
import com.csiro.tickets.LabelDto;
import com.csiro.tickets.PriorityBucketDto;
import com.csiro.tickets.StateDto;
import com.csiro.tickets.TaskAssociationDto;
import com.csiro.tickets.TicketTypeDto;
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

  private TicketTypeDto ticketType;

  private StateDto state;

  private List<LabelDto> labels;

  private String assignee;

  private PriorityBucketDto priorityBucket;

  private Set<ProductDto> products;

  private TaskAssociationDto taskAssociation;

  @JsonProperty("ticket-additional-fields")
  private Set<AdditionalFieldValueDto> additionalFieldValues;
}
