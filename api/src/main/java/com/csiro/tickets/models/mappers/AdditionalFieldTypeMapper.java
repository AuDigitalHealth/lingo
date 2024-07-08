package com.csiro.tickets.models.mappers;

import com.csiro.tickets.AdditionalFieldTypeDto;
import com.csiro.tickets.models.AdditionalFieldType;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface AdditionalFieldTypeMapper {

  AdditionalFieldType toEntity(AdditionalFieldTypeDto additionalFieldTypeDto);

  AdditionalFieldTypeDto toDto(AdditionalFieldType additionalFieldType);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  AdditionalFieldType partialUpdate(
      AdditionalFieldTypeDto additionalFieldTypeDto,
      @MappingTarget AdditionalFieldType additionalFieldType);
}
