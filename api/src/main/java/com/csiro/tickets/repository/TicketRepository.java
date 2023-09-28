package com.csiro.tickets.repository;

import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/*
   Dormant repository,
   Ticket tales await,
   Future queries bring me to life.
*/
public interface TicketRepository extends JpaRepository<Ticket, Long> {

  Page<Ticket> findAll(final Pageable pageable);

  Optional<Ticket> findByTitle(String title);

  @Query(
      nativeQuery = true,
      value =
          "SELECT * FROM ticket t LEFT JOIN ticket_labels tl ON tl.ticket_id = t.id JOIN label l ON l.id = tl.label_id WHERE l.name = :labelName")
  Optional<Ticket> findByTitcketLabel(String labelName);

  Optional<Ticket> findByTicketType(TicketType ticketType);
}
