/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.tickets.repository;

import au.gov.digitalhealth.tickets.helper.SearchCondition;
import au.gov.digitalhealth.tickets.helper.SearchConditionUtils;
import au.gov.digitalhealth.tickets.helper.TicketPredicateBuilder;
import au.gov.digitalhealth.tickets.models.QTicket;
import au.gov.digitalhealth.tickets.models.Ticket;
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
  public Page<Long> findAllIds(
      Predicate predicate, Pageable pageable, Sort sort, List<SearchCondition> searchConditions) {
    QTicket ticket = QTicket.ticket;
    JPAQuery<Long> query = new JPAQuery<>(entityManager);
    query
        .select(ticket.id)
        .from(ticket)
        .where(predicate)
        .offset(pageable.getOffset())
        .limit(pageable.getPageSize());

    addLeftJoins(searchConditions, query);

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

  // for entitys that require a left join because of an order condition
  private void addEntityPath(String order, JPAQuery<Long> query) {
    String lowercaseOrder = order.toLowerCase();
    if (TicketPredicateBuilder.ITERATION_PATH.equals(lowercaseOrder)) {
      query.leftJoin(QTicket.ticket.iteration);
    }
    if (TicketPredicateBuilder.PRIORITY_PATH.equals(lowercaseOrder)) {
      query.leftJoin(QTicket.ticket.priorityBucket);
    }
    if (TicketPredicateBuilder.STATE_PATH.equals(lowercaseOrder)) {
      query.leftJoin(QTicket.ticket.state);
    }
    if (TicketPredicateBuilder.SCHEDULE_ORDER_PATH.equals(lowercaseOrder)) {
      query.leftJoin(QTicket.ticket.schedule);
    }
    if (TicketPredicateBuilder.TASK_PATH.equals(lowercaseOrder)) {
      query.leftJoin(QTicket.ticket.taskAssociation);
    }
    if (TicketPredicateBuilder.TASK_ID_PATH.equals(lowercaseOrder)) {
      query.leftJoin(QTicket.ticket.taskAssociation);
    }
    if (TicketPredicateBuilder.ITERATION_PATH.equals(lowercaseOrder)) {
      query.leftJoin(QTicket.ticket.iteration);
    }
  }

  private void addLeftJoins(List<SearchCondition> searchConditions, JPAQuery<Long> query) {
    if (searchConditions == null) return;

    searchConditions.forEach(
        searchCondition -> {
          String field = searchCondition.getKey().toLowerCase();
          String operation = searchCondition.getOperation();
          String value = searchCondition.getValue();
          List<String> valueIn = searchCondition.getValueIn();
          if (operation.equals(SearchConditionUtils.NOT_EQUALS)) {
            boolean shouldAddEntityPath = true;

            if (value != null) {
              shouldAddEntityPath = !value.equals("null");
            } else if (valueIn != null) {
              shouldAddEntityPath = !valueIn.contains("null");
            }

            if (shouldAddEntityPath) {
              addEntityPath(field, query);
            }
          }
          if (operation.equals(SearchConditionUtils.EQUAL_TO)) {
            boolean shouldAddEntityPath = true;

            if (value != null) {
              shouldAddEntityPath = value.equals("null");
            } else if (valueIn != null) {
              shouldAddEntityPath = valueIn.contains("null");
            }

            if (shouldAddEntityPath) {
              addEntityPath(field, query);
            }
          }
        });
  }
}
