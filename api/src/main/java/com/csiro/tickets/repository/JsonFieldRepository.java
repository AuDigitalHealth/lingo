package com.csiro.tickets.repository;

import com.csiro.tickets.models.JsonField;
import com.csiro.tickets.models.Ticket;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JsonFieldRepository extends JpaRepository<JsonField, Long> {

  Optional<JsonField> findByNameAndTicket(String name, Ticket ticket);
}
