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
package au.gov.digitalhealth.tickets.repository;

import au.gov.digitalhealth.tickets.TaskAssociationDto;
import au.gov.digitalhealth.tickets.TicketTestBase;
import au.gov.digitalhealth.tickets.models.TaskAssociation;
import au.gov.digitalhealth.tickets.models.Ticket;
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
