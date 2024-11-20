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

import au.gov.digitalhealth.tickets.models.TicketFilters;
import au.gov.digitalhealth.tickets.service.TicketFilterService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    value = "/api/tickets",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class TicketFiltersController {

  private final TicketFilterService ticketFilterService;

  public TicketFiltersController(TicketFilterService ticketFilterService) {
    this.ticketFilterService = ticketFilterService;
  }

  @GetMapping("/ticketFilters")
  public List<TicketFilters> getAllFilters() {
    return ticketFilterService.getAllFilters();
  }

  @DeleteMapping("ticketFilters/{id}")
  public ResponseEntity<Void> deleteFilter(@PathVariable Long id) {
    ticketFilterService.deleteFilter(id);
    return new ResponseEntity<>(HttpStatus.NO_CONTENT);
  }

  @PostMapping("ticketFilters")
  public ResponseEntity<TicketFilters> createFilter(@RequestBody TicketFilters ticketFilters) {
    TicketFilters createdTicketFilters = ticketFilterService.createFilter(ticketFilters);
    return new ResponseEntity<>(createdTicketFilters, HttpStatus.OK);
  }

  @PutMapping("ticketFilters/{id}")
  public ResponseEntity<TicketFilters> updateFilter(
      @PathVariable Long id, @RequestBody TicketFilters ticketFilters) {
    TicketFilters savedFilter = ticketFilterService.updateFilter(id, ticketFilters);
    return new ResponseEntity<>(savedFilter, HttpStatus.OK);
  }
}
