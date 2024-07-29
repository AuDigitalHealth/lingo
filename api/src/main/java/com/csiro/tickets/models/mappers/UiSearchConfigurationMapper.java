package com.csiro.tickets.models.mappers;

import com.csiro.snomio.controllers.UiSearchConfigurationDto;
import com.csiro.tickets.models.UiSearchConfiguration;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(
    unmappedTargetPolicy = ReportingPolicy.IGNORE,
    componentModel = "spring",
    uses = {TicketFiltersMapper.class})
public interface UiSearchConfigurationMapper {

  UiSearchConfiguration toEntity(UiSearchConfigurationDto uiSearchConfigurationDto);

  UiSearchConfigurationDto toDto(UiSearchConfiguration uiSearchConfiguration);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  UiSearchConfiguration partialUpdate(
      UiSearchConfigurationDto uiSearchConfigurationDto,
      @MappingTarget UiSearchConfiguration uiSearchConfiguration);
}
