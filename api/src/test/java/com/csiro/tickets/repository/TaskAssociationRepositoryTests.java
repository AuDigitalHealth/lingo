package com.csiro.tickets.repository;

import com.csiro.tickets.TaskAssociationDto;
import com.csiro.tickets.TicketTestBase;
import com.csiro.tickets.models.TaskAssociation;
import com.csiro.tickets.models.Ticket;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class TaskAssociationRepositoryTests extends TicketTestBase {

  @Autowired TaskAssociationRepository taskAssociationRepository;

  @Autowired TicketRepository ticketRepository;

  @Test
  void getAllTaskAssociations() {
    Ticket ticket1 = Ticket.builder().title("Task association test").description("A test").build();
    Ticket savedTicket1 = ticketRepository.save(ticket1);

    TaskAssociation taskAssociation = new TaskAssociation();
    taskAssociation.setTicket(savedTicket1);
    taskAssociation.setTaskId("AU-Test1");

    taskAssociationRepository.save(taskAssociation);

    Ticket ticket2 = Ticket.builder().title("Task association test").description("A test").build();
    Ticket savedTicket2 = ticketRepository.save(ticket2);

    TaskAssociation taskAssociation2 = new TaskAssociation();
    taskAssociation2.setTicket(savedTicket2);
    taskAssociation2.setTaskId("AU-Test2");

    taskAssociationRepository.save(taskAssociation2);

    List<TaskAssociationDto> taskAssociationDtos = taskAssociationRepository.findAllToDto();

    Assertions.assertEquals(2, taskAssociationDtos.size());
  }
}
