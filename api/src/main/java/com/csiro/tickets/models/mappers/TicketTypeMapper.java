package com.csiro.tickets.models.mappers;

import com.csiro.tickets.TicketTypeDto;
import com.csiro.tickets.models.TicketType;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface TicketTypeMapper {

  TicketType toEntity(TicketTypeDto ticketTypeDto);

  TicketTypeDto toDto(TicketType ticketType);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  TicketType partialUpdate(TicketTypeDto ticketTypeDto, @MappingTarget TicketType ticketType);
}
