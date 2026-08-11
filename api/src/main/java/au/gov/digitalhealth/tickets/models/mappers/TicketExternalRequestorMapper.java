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

import au.gov.digitalhealth.tickets.ExternalRequesterDto;
import au.gov.digitalhealth.tickets.TicketExternalRequestorDto;
import au.gov.digitalhealth.tickets.models.TicketExternalRequestor;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface TicketExternalRequestorMapper {

  @Mapping(source = "externalRequestor.id", target = "externalRequestorId")
  @Mapping(source = "externalRequestor.name", target = "name")
  @Mapping(source = "externalRequestor.description", target = "description")
  @Mapping(source = "externalRequestor.displayColor", target = "displayColor")
  @Mapping(source = "dateRequested", target = "dateRequested")
  TicketExternalRequestorDto toDto(TicketExternalRequestor ticketExternalRequestor);

  @Mapping(source = "externalRequestor.name", target = "name")
  @Mapping(source = "externalRequestor.description", target = "description")
  @Mapping(source = "externalRequestor.displayColor", target = "displayColor")
  ExternalRequesterDto toRequesterDto(TicketExternalRequestor ticketExternalRequestor);
}
