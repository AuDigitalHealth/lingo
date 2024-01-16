package com.csiro.tickets;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IterationDto {

  private String name;

  private Instant startDate;

  private Instant endDate;

  private boolean active;

  private boolean completed;
}
