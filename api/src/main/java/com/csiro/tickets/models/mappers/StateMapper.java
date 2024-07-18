package com.csiro.tickets.models.mappers;

import com.csiro.tickets.StateDto;
import com.csiro.tickets.models.State;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface StateMapper {

  State toEntity(StateDto stateDto);

  StateDto toDto(State state);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  State partialUpdate(StateDto stateDto, @MappingTarget State state);
}
