package com.csiro.tickets.helper;

import com.csiro.snomio.exception.InvalidSearchProblem;
import com.csiro.tickets.models.QTicket;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

public class TicketPredicateBuilder {

  public static BooleanBuilder buildPredicate(String search) {
    BooleanBuilder predicate = new BooleanBuilder();

    List<SearchCondition> searchConditions = SearchConditionFactory.parseSearchConditions(search);

    searchConditions.forEach(
        searchCondition -> {
          StringPath path = null;
          String field = searchCondition.getKey();
          String value = searchCondition.getValue();
          if ("title".equals(field)) {
            path = QTicket.ticket.title;
          }
          if ("assignee".equals(field)) {
            path = QTicket.ticket.assignee;
          }
          if ("created".equals(field)) {
            // special case
            DateTimePath<Instant> datePath = QTicket.ticket.created;
            Instant startOfRange = InstantUtils.convert(value);
            if (startOfRange == null) {
              throw new InvalidSearchProblem("Incorrectly formatted date");
            }
            Instant endOfRange = startOfRange.plus(Duration.ofDays(1).minusMillis(1));
            predicate.and(datePath.between(startOfRange, endOfRange));
          }
          if ("description".equals(field)) {
            path = QTicket.ticket.description;
          }
          if ("comments.text".equals(field)) {
            path = QTicket.ticket.comments.any().text;
          }
          if ("iteration.name".equals(field)) {
            path = QTicket.ticket.iteration.name;
          }
          if ("priorityBucket.name".equals(field)) {
            path = QTicket.ticket.priorityBucket.name;
          }
          if ("state.label".equals(field)) {
            path = QTicket.ticket.state.label;
          }
          if ("labels.name".equals(field)) {
            path = QTicket.ticket.labels.any().name;
          }
          if ("additionalFieldValues.valueOf".equals(field)) {
            path = QTicket.ticket.additionalFieldValues.any().valueOf;
          }
          if ("taskAssociation.taskId".equals(field)) {
            path = QTicket.ticket.taskAssociation.taskId;
          }
          createPredicate(predicate, path, value, searchCondition);
        });

    return predicate;
  }

  private static void createPredicate(
      BooleanBuilder predicate, StringPath path, String value, SearchCondition searchCondition) {

    if (path == null) return;

    BooleanExpression generatedPath = createPath(path, value);
    if (!predicate.hasValue()) {
      predicate.or(generatedPath);
    } else if (searchCondition.getCondition().equals("and")) {
      predicate.and(generatedPath);
    } else if (searchCondition.getCondition().equals("or")) {
      predicate.or(generatedPath);
    }
  }

  private static BooleanExpression createPath(StringPath path, String value) {

    if (value.equals("null") || value.isEmpty()) {
      return path.isNull();
    }

    if (value.contains("!")) {
      // first part !, second part val
      String[] parts = value.split("!");
      return path.containsIgnoreCase(parts[1]).not();
    }
    return path.containsIgnoreCase(value);
  }
}
