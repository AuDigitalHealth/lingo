package com.csiro.tickets.models.mappers;

import com.csiro.tickets.AdditionalFieldValueDto;
import com.csiro.tickets.AdditionalFieldValueListTypeQueryDto;
import com.csiro.tickets.models.AdditionalFieldValue;
import java.util.List;
import java.util.Set;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface AdditionalFieldValueMapper {

  AdditionalFieldValue toEntity(AdditionalFieldValueDto additionalFieldValueDto);

  AdditionalFieldValueDto toDto(AdditionalFieldValue additionalFieldValue);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  AdditionalFieldValue partialUpdate(
      AdditionalFieldValueDto additionalFieldValueDto,
      @MappingTarget AdditionalFieldValue additionalFieldValue);

  List<AdditionalFieldValueListTypeQueryDto> toDtoList(
      List<AdditionalFieldValue> additionalFieldValuesForListType);

  Set<AdditionalFieldValue> toEntities(Set<AdditionalFieldValueDto> additionalFieldDtos);
}
