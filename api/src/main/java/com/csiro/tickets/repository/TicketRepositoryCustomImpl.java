package com.csiro.tickets.repository;

import com.csiro.tickets.models.QTicket;
import com.csiro.tickets.models.Ticket;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.dsl.PathBuilder;
import com.querydsl.jpa.impl.JPAQuery;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public class TicketRepositoryCustomImpl implements TicketRepositoryCustom {

  @PersistenceContext private EntityManager entityManager;

  @Override
  public Page<Long> findAllIds(Predicate predicate, Pageable pageable, Sort sort) {
    QTicket ticket = QTicket.ticket;
    JPAQuery<Long> query = new JPAQuery<>(entityManager);
    query
        .select(ticket.id)
        .from(ticket)
        .where(predicate)
        .offset(pageable.getOffset())
        .limit(pageable.getPageSize());

    // Apply sorting from the Sort parameter
    if (sort != null && sort.isSorted()) {
      sort.forEach(
          order -> {
            PathBuilder<Ticket> pathBuilder = new PathBuilder<>(Ticket.class, "ticket");
            if (order.isAscending()) {
              query.orderBy(pathBuilder.getString(order.getProperty()).asc());
            } else {
              query.orderBy(pathBuilder.getString(order.getProperty()).desc());
            }
          });
    }

    List<Long> ids = query.fetch();
    long total = query.fetchCount();

    return new PageImpl<>(ids, pageable, total);
  }
}
