package com.csiro.tickets.repository;

import com.csiro.tickets.models.QTicket;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketType;
import com.querydsl.core.types.dsl.StringPath;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.querydsl.binding.QuerydslBinderCustomizer;
import org.springframework.data.querydsl.binding.QuerydslBindings;

public interface TicketRepository
    extends JpaRepository<Ticket, Long>,
        QuerydslPredicateExecutor<Ticket>,
        QuerydslBinderCustomizer<QTicket> {

  @Override
  default void customize(QuerydslBindings bindings, QTicket root) {
    bindings
        .bind(String.class)
        .first((StringPath path, String value) -> path.containsIgnoreCase(value));
  }

  Page<Ticket> findAll(final Pageable pageable);

  Optional<Ticket> findByTitle(String title);

  @Query(
      nativeQuery = true,
      value =
          "SELECT * FROM ticket t LEFT JOIN ticket_labels tl ON tl.ticket_id = t.id JOIN label l ON l.id = tl.label_id WHERE l.name = :labelName")
  Optional<Ticket> findByTitcketLabel(String labelName);

  Optional<Ticket> findByTicketType(TicketType ticketType);

  @Query(
      nativeQuery = true,
      value =
          "SELECT * FROM Ticket as ticket where ticket.iteration_id = :iterationId and ticket.state_id = :stateId")
  List<Ticket> findAllByAdhaQuery(Long iterationId, Long stateId);
}
