package com.csiro.tickets.repository;

import com.csiro.tickets.models.QTicket;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketType;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import java.time.Duration;
import java.time.Instant;
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
        .first(
            (StringPath path, String value) -> {
              if (value.equals("null") || value.isEmpty()) {
                return path.isNull();
              }

              return path.containsIgnoreCase(value);
            });

    bindings
        .bind(Instant.class)
        .first(
            (DateTimePath<Instant> path, Instant value) -> {
              if (path.toString().equals("ticket.created")) {
                // up to the next day, but not including
                Instant endOfRange = value.plus(Duration.ofDays(1).minusMillis(1));
                return path.between(value, endOfRange);
              }
              return path.eq(value);
            });
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
          "SELECT DISTINCT t.* FROM ticket t  JOIN ticket_labels tl on t.id = tl.ticket_id JOIN label l on tl.label_id = l.id where l.name NOT IN :values AND t.state_id = :stateId and t.iteration_id = :iterationId")
  //          "SELECT * FROM Ticket as ticket where ticket.iteration_id = :iterationId and
  // ticket.state_id = :stateId")
  List<Ticket> findAllByIterationAdhaQuery(List<String> values, Long iterationId, Long stateId);

  @Query(
      nativeQuery = true,
      //      value = "SELECT DISTINCT t.* FROM ticket t JOIN ticket_labels tl on t.id =
      // tl.ticket_id JOIN label l on tl.label_id = l.id where l.name NOT IN :values"
      value =
          "SELECT DISTINCT t.* FROM ticket t  JOIN ticket_labels tl on t.id = tl.ticket_id JOIN label l on tl.label_id = l.id where l.name NOT IN :values AND t.state_id != :stateId")
  List<Ticket> findAllAdhaQuery(List<String> values, Long stateId);
}
