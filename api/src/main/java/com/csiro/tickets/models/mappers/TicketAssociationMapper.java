package com.csiro.tickets.models.mappers;

import com.csiro.tickets.TicketAssociationDto;
import com.csiro.tickets.models.TicketAssociation;
import java.util.Set;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface TicketAssociationMapper {

  TicketAssociation toEntity(TicketAssociationDto ticketAssociationDto);

  @Mapping(target = "associationSource.id", source = "associationSource.id")
  @Mapping(target = "associationTarget.created", source = "associationTarget.created")
  @Mapping(target = "associationTarget.createdBy", source = "associationTarget.createdBy")
  @Mapping(target = "associationTarget.modified", source = "associationTarget.modified")
  @Mapping(target = "associationTarget.modifiedBy", source = "associationTarget.modifiedBy")
  TicketAssociationDto toDto(TicketAssociation ticketAssociation);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  TicketAssociation partialUpdate(
      TicketAssociationDto ticketAssociationDto,
      @MappingTarget TicketAssociation ticketAssociation);

  Set<TicketAssociationDto> toDtoSet(Set<TicketAssociation> associations);
}
