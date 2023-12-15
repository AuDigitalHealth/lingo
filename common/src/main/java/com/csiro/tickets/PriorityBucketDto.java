package com.csiro.tickets;


import com.csiro.tickets.models.PriorityBucket;
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

  public static PriorityBucketDto of(PriorityBucket priorityBucket) {
    if (priorityBucket == null) return null;

    return PriorityBucketDto.builder()
        .name(priorityBucket.getName())
        .orderIndex(priorityBucket.getOrderIndex())
        .description(priorityBucket.getDescription())
        .build();
  }
}
