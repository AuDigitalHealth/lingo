package com.csiro.tickets.models.mappers;

import com.csiro.tickets.ExternalRequesterDto;
import com.csiro.tickets.models.ExternalRequestor;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface ExternalRequestorMapper {

  ExternalRequestor toEntity(ExternalRequesterDto externalRequesterDto);

  ExternalRequesterDto toDto(ExternalRequestor externalRequestor);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  ExternalRequestor partialUpdate(
      ExternalRequesterDto externalRequesterDto,
      @MappingTarget ExternalRequestor externalRequestor);
}
