package com.csiro.tickets.models.mappers;

import com.csiro.tickets.JsonFieldDto;
import com.csiro.tickets.models.JsonField;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface JsonFieldMapper {

  JsonField toEntity(JsonFieldDto jsonFieldDto);

  JsonFieldDto toDto(JsonField jsonField);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  JsonField partialUpdate(JsonFieldDto jsonFieldDto, @MappingTarget JsonField jsonField);
}
