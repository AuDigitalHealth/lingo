package com.csiro.tickets.models.mappers;

import com.csiro.tickets.LabelDto;
import com.csiro.tickets.models.Label;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface LabelMapper {

  Label toEntity(LabelDto labelDto);

  LabelDto toDto(Label label);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  Label partialUpdate(LabelDto labelDto, @MappingTarget Label label);
}
