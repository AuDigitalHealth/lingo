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

import au.gov.digitalhealth.tickets.ScheduleDto;
import au.gov.digitalhealth.tickets.TicketBacklogDto;
import au.gov.digitalhealth.tickets.TicketDto;
import au.gov.digitalhealth.tickets.TicketDtoExtended;
import au.gov.digitalhealth.tickets.TicketImportDto;
import au.gov.digitalhealth.tickets.TicketMinimalDto;
import au.gov.digitalhealth.tickets.models.Schedule;
import au.gov.digitalhealth.tickets.models.Ticket;
import java.util.HashSet;
import java.util.List;
import org.mapstruct.AfterMapping;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

@Mapper(
    unmappedTargetPolicy = ReportingPolicy.IGNORE,
    componentModel = "spring",
    uses = {TicketExternalRequestorMapper.class})
public interface TicketMapper {

  @Mapping(target = "ticketExternalRequestors", ignore = true)
  Ticket toEntity(TicketDto ticketDto);

  @Mapping(target = "ticketExternalRequestors", ignore = true)
  Ticket toEntity(TicketImportDto ticketImportDto);

  @AfterMapping
  default void linkJsonFields(@MappingTarget Ticket ticket) {
    if (ticket.getJsonFields() == null) {
      ticket.setJsonFields(new HashSet<>());
    } else {
      ticket.getJsonFields().forEach(jsonField -> jsonField.setTicket(ticket));
    }
  }

  @Named("toDto")
  @Mapping(source = "ticketExternalRequestors", target = "externalRequestors")
  TicketDto toDto(Ticket ticket);

  @Mapping(source = "ticketExternalRequestors", target = "externalRequestors")
  TicketImportDto toImportDto(Ticket ticket);

  TicketMinimalDto toMinimalDto(Ticket ticket);

  TicketDto toDtoFromMinimalDto(TicketMinimalDto ticketMinimalDto);

  @Mapping(source = "ticketExternalRequestors", target = "externalRequestors")
  TicketBacklogDto toBacklogDto(Ticket ticket);

  @Named("toExtendedDto")
  @Mapping(source = "ticketExternalRequestors", target = "externalRequestors")
  TicketDtoExtended toExtendedDto(Ticket ticket);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  @Mapping(target = "ticketExternalRequestors", ignore = true)
  Ticket partialUpdate(TicketDto ticketDto, @MappingTarget Ticket ticket);

  default ScheduleMapper scheduleMapper() {
    return Mappers.getMapper(ScheduleMapper.class);
  }

  default Schedule map(List<ScheduleDto> scheduleDtos) {
    if (scheduleDtos == null || scheduleDtos.isEmpty()) {
      return null;
    } else if (scheduleDtos.size() == 1) {
      return scheduleMapper().toEntity(scheduleDtos.get(0));
    } else {
      throw new IllegalArgumentException("Multiple schedules found for ticket");
    }
  }

  default List<ScheduleDto> map(Schedule schedule) {
    return List.of(scheduleMapper().toDto(schedule));
  }

  List<TicketDto> toDtoList(List<Ticket> ticketEntities);

  @Mapping(target = "ticketExternalRequestors", ignore = true)
  Ticket toEntityFromBacklogDto(TicketBacklogDto ticketBacklogDto);
}
