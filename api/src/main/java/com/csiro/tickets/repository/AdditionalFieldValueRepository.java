package com.csiro.tickets.repository;

import com.csiro.tickets.models.AdditionalFieldValue;
import com.csiro.tickets.models.Ticket;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdditionalFieldValueRepository extends JpaRepository<AdditionalFieldValue, Long> {

  List<AdditionalFieldValue> findAllByTickets(Ticket ticket);
}
