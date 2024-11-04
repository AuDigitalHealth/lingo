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

import au.gov.digitalhealth.tickets.service.TicketServiceImpl;
import java.util.Set;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BulkProductActionController {

  final TicketServiceImpl ticketService;

  public BulkProductActionController(TicketServiceImpl ticketService) {
    this.ticketService = ticketService;
  }

  @PutMapping(
      value = "/api/tickets/{ticketId}/bulk-product-actions",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public void put(@PathVariable Long ticketId, @RequestBody BulkProductActionDto dto) {
    ticketService.putBulkProductActionOnTicket(ticketId, dto);
  }

  @GetMapping(value = "/api/tickets/{ticketId}/bulk-product-actions")
  public Set<BulkProductActionDto> getAllForTicket(@PathVariable Long ticketId) {
    return ticketService.getBulkProductActionForTicket(ticketId);
  }

  @GetMapping(value = "/api/tickets/{ticketId}/bulk-product-actions/{name}")
  public BulkProductActionDto get(@PathVariable Long ticketId, @PathVariable String name) {
    return ticketService.getBulkProductActionByName(ticketId, name);
  }

  @DeleteMapping(value = "/api/tickets/{ticketId}/bulk-product-actions/{name}")
  public ResponseEntity<Void> delete(@PathVariable Long ticketId, @PathVariable String name) {
    ticketService.deleteBulkProductAction(ticketId, name);
    return ResponseEntity.noContent().build();
  }
}
