package com.csiro.tickets.models.mappers;

import com.csiro.snomio.controllers.TicketFiltersDto;
import com.csiro.tickets.models.TicketFilters;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface TicketFiltersMapper {

  TicketFilters toEntity(TicketFiltersDto ticketFiltersDto);

  TicketFiltersDto toDto(TicketFilters ticketFilters);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  TicketFilters partialUpdate(
      TicketFiltersDto ticketFiltersDto, @MappingTarget TicketFilters ticketFilters);
}
