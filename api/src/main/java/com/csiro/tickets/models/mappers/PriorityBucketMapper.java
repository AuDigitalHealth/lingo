package com.csiro.tickets.models.mappers;

import com.csiro.tickets.PriorityBucketDto;
import com.csiro.tickets.models.PriorityBucket;

public class PriorityBucketMapper {

  private PriorityBucketMapper() {
    throw new AssertionError("This class cannot be instantiated");
  }

  public static PriorityBucketDto mapToDTO(PriorityBucket priorityBucket) {
    if (priorityBucket == null) return null;

    return PriorityBucketDto.builder()
        .name(priorityBucket.getName())
        .orderIndex(priorityBucket.getOrderIndex())
        .description(priorityBucket.getDescription())
        .build();
  }

  public static PriorityBucket mapToEntity(PriorityBucketDto priorityBucketDto) {
    if (priorityBucketDto == null) return null;

    return PriorityBucket.builder()
        .name(priorityBucketDto.getName())
        .orderIndex(priorityBucketDto.getOrderIndex())
        .description(priorityBucketDto.getDescription())
        .build();
  }
}
