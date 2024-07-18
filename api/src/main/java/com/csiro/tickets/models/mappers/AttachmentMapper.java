package com.csiro.tickets.models.mappers;

import com.csiro.tickets.AttachmentDto;
import com.csiro.tickets.models.Attachment;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface AttachmentMapper {

  Attachment toEntity(AttachmentDto attachmentDto);

  AttachmentDto toDto(Attachment attachment);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  Attachment partialUpdate(AttachmentDto attachmentDto, @MappingTarget Attachment attachment);
}
