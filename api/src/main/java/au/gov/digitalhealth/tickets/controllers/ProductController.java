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
import java.util.List;
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
public class ProductController {

  final TicketServiceImpl ticketService;

  public ProductController(TicketServiceImpl ticketService) {
    this.ticketService = ticketService;
  }

  @PutMapping(
      value = "/api/tickets/{ticketId}/products",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public void putProduct(@PathVariable Long ticketId, @RequestBody ProductDto product) {
    ticketService.putProductOnTicket(ticketId, product);
  }

  @PutMapping(
      value = "/api/tickets/{ticketId}/products/batch",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public void putProducts(@PathVariable Long ticketId, @RequestBody List<ProductDto> products) {
    ticketService.putProductsOnTicket(ticketId, products);
  }

  @GetMapping(value = "/api/tickets/{ticketId}/products")
  public Set<ProductDto> getProducts(@PathVariable Long ticketId) {
    return ticketService.getProductsForTicket(ticketId);
  }

  @GetMapping(value = "/api/tickets/{ticketId}/products/{name}")
  public ProductDto getProduct(@PathVariable Long ticketId, @PathVariable String name) {
    return ticketService.getProductByName(ticketId, name);
  }

  @DeleteMapping(value = "/api/tickets/{ticketId}/products/{name}")
  public ResponseEntity<Void> deleteProduct(
      @PathVariable Long ticketId, @PathVariable String name) {
    ticketService.deleteProduct(ticketId, name);
    return ResponseEntity.noContent().build();
  }

  @GetMapping(value = "/api/tickets/{ticketId}/products/id/{id}")
  public ProductDto getProductById(@PathVariable Long ticketId, @PathVariable Long id) {
    return ticketService.getProductById(ticketId, id);
  }

  @DeleteMapping(value = "/api/tickets/{ticketId}/products/id/{id}")
  public ResponseEntity<Void> deleteProductById(
      @PathVariable Long ticketId, @PathVariable Long id) {
    ticketService.deleteProduct(ticketId, id);
    return ResponseEntity.noContent().build();
  }
}
