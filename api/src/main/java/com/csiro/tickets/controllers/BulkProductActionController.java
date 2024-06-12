package com.csiro.tickets.controllers;

import com.csiro.tickets.controllers.dto.BulkProductActionDto;
import com.csiro.tickets.service.TicketService;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
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

  final TicketService ticketService;

  @Autowired
  public BulkProductActionController(TicketService ticketService) {
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
