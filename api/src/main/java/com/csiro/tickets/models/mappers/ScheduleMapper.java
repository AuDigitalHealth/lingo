package com.csiro.tickets.models.mappers;

import com.csiro.tickets.ScheduleDto;
import com.csiro.tickets.models.Schedule;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface ScheduleMapper {

  Schedule toEntity(ScheduleDto scheduleDto);

  ScheduleDto toDto(Schedule schedule);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  Schedule partialUpdate(ScheduleDto scheduleDto, @MappingTarget Schedule schedule);
}
