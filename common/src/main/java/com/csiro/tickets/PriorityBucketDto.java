package com.csiro.tickets;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriorityBucketDto {

  private String name;

  private Integer orderIndex;

  private String description;
}
