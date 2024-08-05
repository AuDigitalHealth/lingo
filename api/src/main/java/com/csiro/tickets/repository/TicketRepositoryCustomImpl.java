package com.csiro.tickets.repository;

import com.csiro.tickets.helper.TicketPredicateBuilder;
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
            addEntityPath(order.getProperty(), query);
            if (order.isAscending()) {
              query.orderBy(pathBuilder.getString(order.getProperty()).asc().nullsLast());
            } else {
              query.orderBy(pathBuilder.getString(order.getProperty()).desc().nullsFirst());
            }
          });
    }

    List<Long> ids = query.fetch();
    long total = query.fetchCount();
    return new PageImpl<>(ids, pageable, total);
  }

  // for entitys that require a left join
  private void addEntityPath(String order, JPAQuery<Long> query) {

    if (TicketPredicateBuilder.ITERATION_PATH.equals(order)) {
      query.leftJoin(QTicket.ticket.iteration);
    }
    if (TicketPredicateBuilder.PRIORITY_PATH.equals(order)) {
      query.leftJoin(QTicket.ticket.priorityBucket);
    }
    if (TicketPredicateBuilder.STATE_PATH.equals(order)) {
      query.leftJoin(QTicket.ticket.state);
    }
    if (TicketPredicateBuilder.SCHEDULE_PATH.equals(order)) {
      query.leftJoin(QTicket.ticket.schedule);
    }
    if (TicketPredicateBuilder.TASK_PATH.equals(order)) {
      query.leftJoin(QTicket.ticket.taskAssociation);
    }
    if (TicketPredicateBuilder.TASK_ID_PATH.equals(order)) {
      query.leftJoin(QTicket.ticket.taskAssociation);
    }
    if (order.equals("iteration.name")) {
      query.leftJoin(QTicket.ticket.iteration);
    }
  }
}
