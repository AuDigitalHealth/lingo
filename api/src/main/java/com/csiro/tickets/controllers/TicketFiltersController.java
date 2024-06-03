package com.csiro.tickets.controllers;

import com.csiro.tickets.models.TicketFilters;
import com.csiro.tickets.service.TicketFilterService;
import java.util.List;
import lombok.extern.java.Log;
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

@Log
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
    return new ResponseEntity<>(HttpStatus.OK);
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
