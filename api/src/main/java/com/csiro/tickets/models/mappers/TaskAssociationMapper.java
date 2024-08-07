package com.csiro.tickets.models.mappers;

import com.csiro.tickets.TaskAssociationDto;
import com.csiro.tickets.models.TaskAssociation;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface TaskAssociationMapper {

  TaskAssociation toEntity(TaskAssociationDto taskAssociationDto);

  TaskAssociationDto toDto(TaskAssociation taskAssociation);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  TaskAssociation partialUpdate(
      TaskAssociationDto taskAssociationDto, @MappingTarget TaskAssociation taskAssociation);
}
