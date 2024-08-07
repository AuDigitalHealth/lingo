package com.csiro.tickets.models.mappers;

import com.csiro.tickets.AttachmentTypeDto;
import com.csiro.tickets.models.AttachmentType;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface AttachmentTypeMapper {

  AttachmentType toEntity(AttachmentTypeDto attachmentTypeDto);

  AttachmentTypeDto toDto(AttachmentType attachmentType);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  AttachmentType partialUpdate(
      AttachmentTypeDto attachmentTypeDto, @MappingTarget AttachmentType attachmentType);
}
