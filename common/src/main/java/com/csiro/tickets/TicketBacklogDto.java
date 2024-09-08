package com.csiro.tickets;

import java.io.Serializable;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Data
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class TicketBacklogDto extends BaseAuditableDto implements Serializable {

  private String title;

  private String ticketNumber;

  private String description;

  private String assignee;

  private StateDto state;

  private Set<LabelDto> labels;

  private IterationDto iteration;

  private Set<ExternalRequesterDto> externalRequestors;

  private PriorityBucketDto priorityBucket;

  private TaskAssociationDto taskAssociation;

  private ScheduleDto schedule;
}
