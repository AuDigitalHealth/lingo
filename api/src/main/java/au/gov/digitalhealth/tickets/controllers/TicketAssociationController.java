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
package au.gov.digitalhealth.tickets.controllers;

import au.gov.digitalhealth.tickets.TicketAssociationDto;
import au.gov.digitalhealth.tickets.service.TicketAssociationService;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets/ticketAssociation")
public class TicketAssociationController {

  private final TicketAssociationService ticketAssociationService;

  @Autowired
  public TicketAssociationController(TicketAssociationService ticketAssociationService) {
    this.ticketAssociationService = ticketAssociationService;
  }

  @PostMapping("sourceTicket/{sourceId}/targetTicket/{targetId}")
  public ResponseEntity<TicketAssociationDto> createTicketAssociation(
      @PathVariable Long sourceId, @PathVariable Long targetId) {
    return new ResponseEntity<>(
        ticketAssociationService.createAssociation(sourceId, targetId), HttpStatus.CREATED);
  }

  @DeleteMapping("{id}")
  public ResponseEntity<HttpStatus> deleteTicketAssociation(@PathVariable Long id) {
    ticketAssociationService.deleteAssociation(id);

    return new ResponseEntity<>(HttpStatus.NO_CONTENT);
  }

  @GetMapping("sourceAssociations")
  public Set<TicketAssociationDto> getTicketAssociations(
      @RequestParam(name = "ticketIds", required = true) Set<Long> ticketIds) {
    return ticketAssociationService.getTicketSourceAssociations(ticketIds);
  }

  @GetMapping("{ticketId}")
  public Set<TicketAssociationDto> getAllTicketAssociations(@PathVariable Long ticketId) {
    return ticketAssociationService.getAssociationsForTicket(ticketId);
  }
}
