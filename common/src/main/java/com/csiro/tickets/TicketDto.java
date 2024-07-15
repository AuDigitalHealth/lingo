package com.csiro.tickets;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Data
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class TicketDto extends TicketMinimalDto {

  private IterationDto iteration;

  private TicketTypeDto ticketType;

  private Set<ExternalRequesterDto> externalRequestors;

  private PriorityBucketDto priorityBucket;

  private TaskAssociationDto taskAssociation;

  private ScheduleDto schedule;
}
