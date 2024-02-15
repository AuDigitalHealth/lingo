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

  private static final String TITLE_PATH = "title";

  private static final String ASSIGNEE_PATH = "assignee";

  private static final String CREATED_PATH = "created";

  private static final String DESCRIPTION_PATH = "description";

  private static final String COMMENTS_PATH = "comments.text";

  private static final String PRIORITY_PATH = "prioritybucket.name";

  private static final String LABELS_PATH = "labels.name";

  private static final String STATE_PATH = "state.label";

  private static final String ITERATION_PATH = "iteration.name";

  private static final String AF_PATH = "additionalfieldvalues.valueOf";

  private static final String TASK_PATH = "taskassociation";

  private static final String TASK_ID_PATH = "taskassociation.taskId";



  public static BooleanBuilder buildPredicate(String search) {

    List<SearchCondition> searchConditions = SearchConditionFactory.parseSearchConditions(search);

    return buildPredicateFromSearchConditions(searchConditions);
  }

  public static BooleanBuilder buildPredicateFromSearchConditions(
      List<SearchCondition> searchConditions) {
    BooleanBuilder predicate = new BooleanBuilder();

    if (searchConditions == null) return predicate;
    searchConditions.forEach(
        searchCondition -> {
          BooleanExpression combinedConditions = null;
          BooleanExpression booleanExpression = null;
          StringPath path = null;
          String field = searchCondition.getKey().toLowerCase();
          String condition = searchCondition.getCondition();
          String operation = searchCondition.getOperation();
          String value = searchCondition.getValue();
          List<String> valueIn = searchCondition.getValueIn();
          BooleanExpression nullExpression = null;
          if(valueInContainsNull(valueIn)){
            nullExpression = createNullExpressions(field);
            valueIn = removeNullValueIn(valueIn);
          }
          if (TITLE_PATH.equals(field)) {
            path = QTicket.ticket.title;
          }
          if (ASSIGNEE_PATH.equals(field)) {
            path = QTicket.ticket.assignee;
          }
          if (CREATED_PATH.equals(field)) {
            // special case
            DateTimePath<Instant> datePath = QTicket.ticket.created;
            String[] dates = InstantUtils.splitDates(value);
            Instant startOfRange = InstantUtils.convert(dates[0]);
            if (startOfRange == null) {
              throw new InvalidSearchProblem("Incorrectly formatted date");
            }
            Instant endOfRange = null;
            if (dates.length == 2 && dates[1] != null) {
              endOfRange = InstantUtils.convert(dates[1]);
            } else {
              endOfRange = startOfRange.plus(Duration.ofDays(1).minusMillis(1));
            }
            BooleanExpression between = datePath.between(startOfRange, endOfRange);
            switch (operation) {
              case SearchConditionUtils.NOT_EQUALS -> predicate.and(between.not());
              case SearchConditionUtils.LESS_THAN -> predicate.and(datePath.before(startOfRange));
              case SearchConditionUtils.GREATER_THAN -> predicate.and(datePath.after(endOfRange));
              default -> predicate.and(between);
            }
          }
          if (DESCRIPTION_PATH.equals(field)) {
            path = QTicket.ticket.description;
          }
          if (COMMENTS_PATH.equals(field)) {
            path = QTicket.ticket.comments.any().text;
          }
          if (ITERATION_PATH.equals(field)) {
            path = QTicket.ticket.iteration.name;
          }
          if (PRIORITY_PATH.equals(field)) {
            path = QTicket.ticket.priorityBucket.name;
          }
          if (STATE_PATH.equals(field)) {
            path = QTicket.ticket.state.label;
          }
          if (LABELS_PATH.equals(field)) {
            path = QTicket.ticket.labels.any().name;

            if (condition.equalsIgnoreCase("and")) {
              for (String labelName : valueIn) {
                if (combinedConditions == null) {
                  combinedConditions = QTicket.ticket.labels.any().name.eq(labelName);
                } else {
                  combinedConditions =
                      combinedConditions.and(QTicket.ticket.labels.any().name.eq(labelName));
                }
              }
            }
          }
          if (AF_PATH.equals(field)) {
            path = QTicket.ticket.additionalFieldValues.any().valueOf;
          }
          if (TASK_PATH.equals(field)) {
            booleanExpression = QTicket.ticket.taskAssociation.isNull();
          }
          if (TASK_ID_PATH.equals(field)) {
            path = QTicket.ticket.taskAssociation.taskId;
          }

          if (combinedConditions == null) {
            createPredicate(predicate, booleanExpression, nullExpression, path, value, valueIn, searchCondition);
          } else {
            predicate.and(combinedConditions);
          }
        });

    return predicate;
  }

  private static void createPredicate(
      BooleanBuilder predicate,
      BooleanExpression booleanExpression,
      BooleanExpression nullExpression,
      StringPath path,
      String value,
      List<String> valueIn,
      SearchCondition searchCondition) {

    if (booleanExpression != null) {
      predicate.and(booleanExpression);
    }
    if (path == null) return;

    BooleanExpression generatedExpression =
        createPath(path, nullExpression, value, valueIn, searchCondition.getOperation());
    if (!predicate.hasValue()) {
      predicate.or(generatedExpression);
    } else if (searchCondition.getCondition().equals("and")) {
      predicate.and(generatedExpression);
    } else if (searchCondition.getCondition().equals("or")) {
      predicate.or(generatedExpression);
    }
  }

  private static BooleanExpression createPath(
      StringPath path, BooleanExpression nullExpression, String value, List<String> valueIn, String operation) {

    BooleanExpression booleanExpression = null;
    if (value == null && valueIn != null) {
      return addNullExpression(path.in(valueIn), nullExpression);
    }

    if (value.equals("null") || value.isEmpty()) {
      return addNullExpression(path.isNull(), nullExpression);
    }

    if (value.contains("!")) {
      // first part !, second part val
      String[] parts = value.split("!");
      return addNullExpression(path.containsIgnoreCase(parts[1]).not(), nullExpression);
    }
    return addNullExpression(path.containsIgnoreCase(value), nullExpression);
  }

  private static BooleanExpression addNullExpression(BooleanExpression booleanExpression, BooleanExpression nullExpression) {
    if(nullExpression != null){
      return booleanExpression.or(nullExpression);
    }
    return booleanExpression;
  }

  private static BooleanExpression createNullExpressions(String field) {
    BooleanExpression nullPath = null;

    if (ASSIGNEE_PATH.equals(field)) {
      nullPath = QTicket.ticket.assignee.isNull();
    }
    if (ITERATION_PATH.equals(field)) {
      nullPath = QTicket.ticket.iteration.isNull();
    }
    if (PRIORITY_PATH.equals(field)) {
      nullPath = QTicket.ticket.priorityBucket.isNull();
    }
    if (STATE_PATH.equals(field)) {
      nullPath = QTicket.ticket.state.isNull();
    }
    if (TASK_PATH.equals(field)) {
      nullPath = QTicket.ticket.taskAssociation.isNull();
    }
    if (TASK_ID_PATH.equals(field)) {
      nullPath = QTicket.ticket.taskAssociation.isNull();
    }

    return nullPath;
  }

  private static boolean valueInContainsNull(List<String> valueIn){
    if(valueIn == null) return false;
    return valueIn.contains("null");
  }

  private static List<String> removeNullValueIn(List<String> valueIn) {
    return valueIn.stream().filter(v -> !v.equals("null")).toList();
  }


}
