package com.csiro.tickets.controllers;

import com.csiro.tickets.controllers.dto.ProductDto;
import com.csiro.tickets.service.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProductController {

  final TicketService ticketService;

  @Autowired
  public ProductController(TicketService ticketService) {
    this.ticketService = ticketService;
  }

  @PutMapping(
      value = "/api/tickets/{ticketId}/products",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public void putProduct(@PathVariable Long ticketId, @RequestBody ProductDto product) {
    ticketService.putProductOnTicket(ticketId, product);
  }
}
