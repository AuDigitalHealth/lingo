/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.tickets.models.mappers;

import au.gov.digitalhealth.tickets.JobResultDto;
import au.gov.digitalhealth.tickets.models.JobResult;
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
