package com.csiro.tickets;

import java.io.Serializable;
import java.time.Instant;
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
public class IterationDto extends BaseAuditableDto implements Serializable {

  private String name;

  private Instant startDate;

  private Instant endDate;

  private boolean active;

  private boolean completed;
}
