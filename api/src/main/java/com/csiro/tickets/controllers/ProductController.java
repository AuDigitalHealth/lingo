package com.csiro.tickets.controllers;

import com.csiro.tickets.controllers.dto.ProductDto;
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

  @GetMapping(value = "/api/tickets/{ticketId}/products")
  public Set<ProductDto> getProduct(@PathVariable Long ticketId) {
    return ticketService.getProductsForTicket(ticketId);
  }

  @DeleteMapping(value = "/api/tickets/{ticketId}/products/{name}")
  public ResponseEntity getProduct(@PathVariable Long ticketId, @PathVariable String name) {
    ticketService.deleteProduct(ticketId, name);
    return ResponseEntity.noContent().build();
  }
}
