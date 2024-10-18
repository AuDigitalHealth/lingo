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
package au.gov.digitalhealth.tickets.service;

import au.gov.digitalhealth.lingo.exception.ResourceAlreadyExists;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.models.TicketFilters;
import au.gov.digitalhealth.tickets.repository.TicketFiltersRepository;
import au.gov.digitalhealth.tickets.repository.UiSearchConfigurationRepository;
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
