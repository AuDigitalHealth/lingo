package com.csiro.tickets.models.mappers;

import com.csiro.tickets.TransitionDto;
import com.csiro.tickets.models.Transition;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface TransitionMapper {

  Transition toEntity(TransitionDto transitionDto);

  TransitionDto toDto(Transition transition);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  Transition partialUpdate(TransitionDto transitionDto, @MappingTarget Transition transition);
}
