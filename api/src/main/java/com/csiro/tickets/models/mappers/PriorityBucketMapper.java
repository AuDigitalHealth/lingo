package com.csiro.tickets.models.mappers;

import com.csiro.tickets.PriorityBucketDto;
import com.csiro.tickets.models.PriorityBucket;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface PriorityBucketMapper {

  PriorityBucket toEntity(PriorityBucketDto priorityBucketDto);

  PriorityBucketDto toDto(PriorityBucket priorityBucket);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  PriorityBucket partialUpdate(
      PriorityBucketDto priorityBucketDto, @MappingTarget PriorityBucket priorityBucket);
}
