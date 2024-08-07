package com.csiro.tickets.service;

import com.csiro.snomio.exception.ResourceAlreadyExists;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.models.TicketFilters;
import com.csiro.tickets.repository.TicketFiltersRepository;
import com.csiro.tickets.repository.UiSearchConfigurationRepository;
import java.util.List;
import java.util.Optional;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Log
@Service
public class TicketFilterService {

  final TicketFiltersRepository ticketFiltersRepository;
  private final UiSearchConfigurationRepository uiSearchConfigurationRepository;

  @Autowired
  TicketFilterService(
      TicketFiltersRepository ticketFiltersRepository,
      UiSearchConfigurationRepository uiSearchConfigurationRepository) {
    this.ticketFiltersRepository = ticketFiltersRepository;
    this.uiSearchConfigurationRepository = uiSearchConfigurationRepository;
  }

  public List<TicketFilters> getAllFilters() {
    return ticketFiltersRepository.findAll();
  }

  @Transactional
  public void deleteFilter(Long id) {
    TicketFilters ticketFilters =
        ticketFiltersRepository
            .findById(id)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(String.format("Filter with ID %s not found", id)));

    log.info("Deleting filter: " + ticketFilters.getName());

    long i = uiSearchConfigurationRepository.deleteByFilter(ticketFilters);
    log.info(
        "Deleted "
            + i
            + " ui search configurations connected to filter "
            + ticketFilters.getName());

    ticketFiltersRepository.delete(ticketFilters);

    log.info("Deleted filter: " + ticketFilters.getName());
  }

  @Transactional
  public TicketFilters createFilter(TicketFilters ticketFilters) {
    String ticketFiltersName = ticketFilters.getName();
    Optional<TicketFilters> foundTicketFilterOptional =
        ticketFiltersRepository.findByName(ticketFiltersName);

    if (foundTicketFilterOptional.isPresent()) {
      throw new ResourceAlreadyExists(
          String.format("Ticket Filter with name %s already exists", ticketFiltersName));
    }
    return ticketFiltersRepository.save(ticketFilters);
  }

  public TicketFilters updateFilter(Long id, TicketFilters ticketFilters) {
    TicketFilters foundTicketFilter =
        ticketFiltersRepository
            .findById(id)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(String.format("Filter with ID %s not found", id)));
    foundTicketFilter.setName(ticketFilters.getName());
    foundTicketFilter.setFilter(ticketFilters.getFilter());

    return ticketFiltersRepository.save(foundTicketFilter);
  }
}
