package com.csiro.tickets.models.mappers;

import com.csiro.tickets.ScheduleDto;
import com.csiro.tickets.TicketBacklogDto;
import com.csiro.tickets.TicketDto;
import com.csiro.tickets.TicketDtoExtended;
import com.csiro.tickets.TicketImportDto;
import com.csiro.tickets.TicketMinimalDto;
import com.csiro.tickets.models.Schedule;
import com.csiro.tickets.models.Ticket;
import java.util.List;
import org.mapstruct.AfterMapping;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE, componentModel = "spring")
public interface TicketMapper {

  Ticket toEntity(TicketDto ticketDto);

  Ticket toEntity(TicketImportDto ticketImportDto);

  @AfterMapping
  default void linkJsonFields(@MappingTarget Ticket ticket) {
    ticket.getJsonFields().forEach(jsonField -> jsonField.setTicket(ticket));
  }

  @Named("toDto")
  TicketDto toDto(Ticket ticket);

  TicketImportDto toImportDto(Ticket ticket);

  TicketMinimalDto toMinimalDto(Ticket ticket);

  TicketDto toDtoFromMinimalDto(TicketMinimalDto ticketMinimalDto);

  TicketBacklogDto toBacklogDto(Ticket ticket);

  @Named("toExtendedDto")
  TicketDtoExtended toExtendedDto(Ticket ticket);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
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

  Ticket toEntityFromBacklogDto(TicketBacklogDto ticketBacklogDto);
}
