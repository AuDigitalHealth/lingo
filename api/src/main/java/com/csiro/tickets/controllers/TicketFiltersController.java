package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ResourceAlreadyExists;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.models.TicketFilters;
import com.csiro.tickets.repository.TicketFiltersRepository;
import com.csiro.tickets.repository.UiSearchConfigurationRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
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

  final TicketFiltersRepository ticketFiltersRepository;
  private final UiSearchConfigurationRepository uiSearchConfigurationRepository;

  @Autowired
  TicketFiltersController(
      TicketFiltersRepository ticketFiltersRepository,
      UiSearchConfigurationRepository uiSearchConfigurationRepository) {
    this.ticketFiltersRepository = ticketFiltersRepository;
    this.uiSearchConfigurationRepository = uiSearchConfigurationRepository;
  }

  @GetMapping("/ticketFilters")
  public List<TicketFilters> getAllFilters() {
    return ticketFiltersRepository.findAll();
  }

  @DeleteMapping("ticketFilters/{id}")
  public ResponseEntity<Void> deleteFilter(@PathVariable Long id) {
    TicketFilters ticketFilters =
        ticketFiltersRepository
            .findById(id)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(String.format("Filter with ID %s not found", id)));
    uiSearchConfigurationRepository
        .findByFilter(ticketFilters)
        .forEach(
            u -> {
              u.setFilter(null);
              uiSearchConfigurationRepository.save(u);
            });
    ticketFiltersRepository.delete(ticketFilters);

    return ResponseEntity.noContent().build();
  }

  @PostMapping("ticketFilters")
  public ResponseEntity<TicketFilters> createFilter(@RequestBody TicketFilters ticketFilters) {

    String ticketFiltersName = ticketFilters.getName();
    Optional<TicketFilters> foundTicketFilterOptional =
        ticketFiltersRepository.findByName(ticketFiltersName);

    if (foundTicketFilterOptional.isPresent()) {
      throw new ResourceAlreadyExists(
          String.format("Ticket Filter with name %s already exists", ticketFiltersName));
    }
    TicketFilters createdTicketFilters = ticketFiltersRepository.save(ticketFilters);

    return new ResponseEntity<>(createdTicketFilters, HttpStatus.OK);
  }

  @PutMapping("ticketFilters/{id}")
  public ResponseEntity<TicketFilters> updateFilter(
      @PathVariable Long id, @RequestBody TicketFilters ticketFilters) {
    TicketFilters foundTicketFilter =
        ticketFiltersRepository
            .findById(id)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(String.format("Filter with ID %s not found", id)));
    foundTicketFilter.setName(ticketFilters.getName());
    foundTicketFilter.setFilter(ticketFilters.getFilter());
    TicketFilters savedFilter = ticketFiltersRepository.save(foundTicketFilter);

    return new ResponseEntity<>(savedFilter, HttpStatus.OK);
  }
}
