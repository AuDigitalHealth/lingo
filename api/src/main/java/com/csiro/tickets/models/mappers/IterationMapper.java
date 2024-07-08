package com.csiro.tickets.models.mappers;

import com.csiro.tickets.IterationDto;
import com.csiro.tickets.models.Iteration;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface IterationMapper {

  Iteration toEntity(IterationDto iterationDto);

  IterationDto toDto(Iteration iteration);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  Iteration partialUpdate(IterationDto iterationDto, @MappingTarget Iteration iteration);
}
