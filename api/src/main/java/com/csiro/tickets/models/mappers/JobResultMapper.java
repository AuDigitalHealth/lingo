package com.csiro.tickets.models.mappers;

import com.csiro.tickets.JobResultDto;
import com.csiro.tickets.models.JobResult;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface JobResultMapper {

  JobResult toEntity(JobResultDto jobResultDto);

  JobResultDto toDto(JobResult jobResult);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  JobResult partialUpdate(JobResultDto jobResultDto, @MappingTarget JobResult jobResult);

  JobResult.Result toEntity(JobResultDto.ResultDto resultDto);

  JobResultDto.ResultDto toDto(JobResult.Result result);

  JobResult.Result.ResultItem toEntity(JobResultDto.ResultDto.ResultItemDto resultItemDto);

  JobResultDto.ResultDto.ResultItemDto toDto(JobResult.Result.ResultItem resultItem);
}
