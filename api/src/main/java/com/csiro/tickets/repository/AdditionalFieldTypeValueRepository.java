package com.csiro.tickets.repository;

import com.csiro.tickets.models.AdditionalFieldTypeValue;
import com.csiro.tickets.models.Ticket;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdditionalFieldTypeValueRepository
    extends JpaRepository<AdditionalFieldTypeValue, Long> {

  List<AdditionalFieldTypeValue> findAllByTickets(Ticket ticket);
}
