package com.csiro.tickets.repository;

import com.csiro.tickets.models.QTicket;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketType;
import com.querydsl.core.types.dsl.StringPath;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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

  List<Ticket> findByTitle(String title);

  List<Ticket> findByTicketType(TicketType ticketType);
}
