package com.csiro.tickets.repository;

import com.csiro.tickets.models.TicketFilters;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketFiltersRepository extends JpaRepository<TicketFilters, Long> {

  Optional<TicketFilters> findByName(String name);
}
