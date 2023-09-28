package com.csiro.tickets.repository;

import com.csiro.tickets.models.TicketType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketTypeRepository extends JpaRepository<TicketType, Long> {
  Optional<TicketType> findByName(String name);
}
