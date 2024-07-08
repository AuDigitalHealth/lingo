package com.csiro.tickets.models.mappers;

import com.csiro.tickets.controllers.BulkProductActionDto;
import com.csiro.tickets.models.BulkProductAction;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(
    unmappedTargetPolicy = ReportingPolicy.IGNORE,
    componentModel = "spring",
    uses = {TicketMapper.class})
public interface BulkProductActionMapper {

  BulkProductAction toEntity(BulkProductActionDto bulkProductActionDto);

  BulkProductActionDto toDto(BulkProductAction bulkProductAction);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  BulkProductAction partialUpdate(
      BulkProductActionDto bulkProductActionDto,
      @MappingTarget BulkProductAction bulkProductAction);
}
