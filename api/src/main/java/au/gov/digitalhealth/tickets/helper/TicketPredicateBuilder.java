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
package au.gov.digitalhealth.tickets.helper;

import au.gov.digitalhealth.lingo.exception.InvalidSearchProblem;
import au.gov.digitalhealth.tickets.models.QTicket;
import au.gov.digitalhealth.tickets.models.QTicketAssociation;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.JPAExpressions;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

public class TicketPredicateBuilder {
  public static final String TICKET_NUMBER_PATH = "ticketnumber";

  public static final String TITLE_PATH = "title";

  public static final String ASSIGNEE_PATH = "assignee";

  public static final String CREATED_PATH = "created";

  public static final String DESCRIPTION_PATH = "description";

  public static final String COMMENTS_PATH = "comments.text";

  public static final String PRIORITY_PATH = "prioritybucket.name";

  public static final String LABELS_PATH = "labels.name";
  public static final String EXTERNAL_REQUESTORS_PATH = "externalrequestors.name";

  public static final String STATE_PATH = "state.label";

  public static final String SCHEDULE_PATH = "schedule.name";

  public static final String SCHEDULE_ORDER_PATH = "schedule.grouping";

  public static final String ITERATION_PATH = "iteration.name";

  public static final String AF_PATH = "additionalfieldvalues.valueOf";

  public static final String TASK_PATH = "taskassociation";

  public static final String TASK_ID_PATH = "taskassociation.taskid";

  public static final String TICKET_ASSOCIATION = "ticketassociation";

  private TicketPredicateBuilder() {} // SonarLint

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
          List<String> valueInWithNull = searchCondition.getValueIn();
          BooleanExpression nullExpression = null;
          if (valueInContainsNull(valueIn)
              || (searchCondition.getOperation().equals(SearchConditionUtils.NOT_EQUALS)
                  && !valueInContainsNull(valueIn))) {
            nullExpression = createNullExpressions(field);
            valueIn = removeNullValueIn(valueIn);
          }
          if (TICKET_NUMBER_PATH.equals(field)) {
            path = QTicket.ticket.ticketNumber;
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
          if (SCHEDULE_PATH.equals(field)) {
            path = QTicket.ticket.schedule.name;
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
            if (condition.equalsIgnoreCase("or")) {
              for (String labelName : valueIn) {
                if (combinedConditions == null) {
                  combinedConditions = QTicket.ticket.labels.any().name.eq(labelName);
                } else {
                  combinedConditions =
                      combinedConditions.or(QTicket.ticket.labels.any().name.eq(labelName));
                }
              }
            }
            addNeNullExpression(combinedConditions, nullExpression, condition);
            if (operation.equals(SearchConditionUtils.NOT_EQUALS) && combinedConditions != null) {
              combinedConditions = combinedConditions.not();
            }
          }
          if (EXTERNAL_REQUESTORS_PATH.equals(field)) {
            path = QTicket.ticket.externalRequestors.any().name;

            if (condition.equalsIgnoreCase("and")) {
              for (String labelName : valueIn) {
                if (combinedConditions == null) {
                  combinedConditions = QTicket.ticket.externalRequestors.any().name.eq(labelName);
                } else {
                  combinedConditions =
                      combinedConditions.and(
                          QTicket.ticket.externalRequestors.any().name.eq(labelName));
                }
              }
            }

            if (condition.equalsIgnoreCase("or")) {
              for (String labelName : valueIn) {
                if (combinedConditions == null) {
                  combinedConditions = QTicket.ticket.externalRequestors.any().name.eq(labelName);
                } else {
                  combinedConditions =
                      combinedConditions.or(
                          QTicket.ticket.externalRequestors.any().name.eq(labelName));
                }
              }
            }
            addNeNullExpression(combinedConditions, nullExpression, condition);
            if (operation.equals(SearchConditionUtils.NOT_EQUALS) && combinedConditions != null) {
              combinedConditions = combinedConditions.not();
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
          if (TICKET_ASSOCIATION.equals(field)) {
            // don't want to find ourself, nor do we want to find any ticket we are already linked
            // to, so one where we are the source association,
            // or any ticket where we are the targetAssociation
            QTicket ticket = QTicket.ticket;
            QTicketAssociation association = QTicketAssociation.ticketAssociation;

            Long ticketId = Long.valueOf(value);

            BooleanExpression notSelfTicket = ticket.id.ne(ticketId);

            // Find tickets that are not associated with the passed ticketId in either direction
            BooleanExpression notAssociated =
                ticket
                    .id
                    .notIn(
                        JPAExpressions.select(association.associationSource.id)
                            .from(association)
                            .where(association.associationTarget.id.eq(ticketId)))
                    .and(
                        ticket.id.notIn(
                            JPAExpressions.select(association.associationTarget.id)
                                .from(association)
                                .where(association.associationSource.id.eq(ticketId))));

            booleanExpression = notAssociated.and(notSelfTicket);
          }

          if (combinedConditions == null) {
            createPredicate(
                field,
                predicate,
                booleanExpression,
                nullExpression,
                path,
                value,
                valueIn,
                valueInWithNull,
                searchCondition,
                operation,
                searchConditions);
          } else {
            predicate.and(combinedConditions);
          }
        });

    return predicate;
  }

  private static void createPredicate(
      String field,
      BooleanBuilder predicate,
      BooleanExpression booleanExpression,
      BooleanExpression nullExpression,
      StringPath path,
      String value,
      List<String> valueIn,
      List<String> valueInWithNull,
      SearchCondition searchCondition,
      String operation,
      List<SearchCondition> searchConditions) {

    if (booleanExpression != null) {

      predicate.and(booleanExpression);
    }
    if (path == null) return;

    BooleanExpression generatedExpression;
    if (operation.equals("!=")) {
      generatedExpression =
          createNePath(path, nullExpression, value, valueIn, valueInWithNull, searchCondition);
    } else {
      generatedExpression = createPath(path, nullExpression, value, valueIn);
    }

    if (!predicate.hasValue()) {
      predicate.or(generatedExpression);
    } else if ((COMMENTS_PATH.equals(field)
            || TICKET_NUMBER_PATH.equals(field)
            || TITLE_PATH.equals(field))
        && isQuickSearchField(searchConditions)) {
      predicate.or(generatedExpression);
    } else {
      predicate.and(generatedExpression);
    }
  }

  private static boolean isQuickSearchField(List<SearchCondition> searchConditions) {
    Set<String> requiredKeys =
        new HashSet<>(
            Arrays.asList(
                COMMENTS_PATH.toLowerCase(),
                TICKET_NUMBER_PATH.toLowerCase(),
                TITLE_PATH.toLowerCase()));
    int matchCount = 0;

    for (SearchCondition searchCondition : searchConditions) {
      String key = searchCondition.getKey().toLowerCase();
      if (requiredKeys.contains(key)) {
        matchCount++;
        if (matchCount >= 2) {
          return true;
        }
      }
    }

    return false;
  }

  private static BooleanExpression createNePath(
      StringPath path,
      BooleanExpression nullExpression,
      String value,
      List<String> valueIn,
      List<String> valueInWithNull,
      SearchCondition searchCondition) {
    String andOrOr;
    if (value == null && valueIn != null) {

      BooleanExpression expression = path.notIn(valueIn);
      BooleanExpression nullExpression2;
      if (valueInWithNull.contains("null")) {
        andOrOr = "and";
        nullExpression2 = nullExpression.not();
      } else {
        andOrOr = "or";
        nullExpression2 = nullExpression;
      }

      return addNeNullExpression(!valueIn.isEmpty() ? expression : null, nullExpression2, andOrOr);
    }
    andOrOr = searchCondition.getCondition();
    if (value != null && (value.equals("null") || value.isEmpty())) {
      return addNeNullExpression(path.isNull(), nullExpression, andOrOr);
    }

    return addNeNullExpression(path.containsIgnoreCase(value), nullExpression, andOrOr);
  }

  private static BooleanExpression createPath(
      StringPath path, BooleanExpression nullExpression, String value, List<String> valueIn) {

    if (value == null && valueIn != null) {
      return addNullExpression(!valueIn.isEmpty() ? path.in(valueIn) : null, nullExpression);
    }

    if (value != null && (value.equals("null") || value.isEmpty())) {
      return addNullExpression(path.isNull(), nullExpression);
    }

    if (value != null && value.contains("!")) {
      // first part !, second part val
      String[] parts = value.split("!");
      return addNullExpression(path.containsIgnoreCase(parts[1]).not(), nullExpression);
    }
    return addNullExpression(path.containsIgnoreCase(value), nullExpression);
  }

  private static BooleanExpression addNullExpression(
      BooleanExpression booleanExpression, BooleanExpression nullExpression) {
    if (booleanExpression == null) {
      return nullExpression;
    }
    if (nullExpression != null) {
      return booleanExpression.or(nullExpression);
    }
    return booleanExpression;
  }

  private static BooleanExpression addNeNullExpression(
      BooleanExpression booleanExpression, BooleanExpression nullExpression, String andOrOr) {
    if (booleanExpression == null) {
      return nullExpression;
    }
    if (nullExpression != null) {
      return andOrOr.equals("and")
          ? booleanExpression.and(nullExpression)
          : booleanExpression.or(nullExpression);
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
    if (SCHEDULE_PATH.equals(field)) {
      nullPath = QTicket.ticket.schedule.isNull();
    }
    if (TASK_PATH.equals(field)) {
      nullPath = QTicket.ticket.taskAssociation.isNull();
    }
    if (TASK_ID_PATH.equals(field)) {
      nullPath = QTicket.ticket.taskAssociation.isNull();
    }
    if (LABELS_PATH.equals(field)) {
      nullPath = QTicket.ticket.labels.isEmpty();
    }
    if (EXTERNAL_REQUESTORS_PATH.equals(field)) {
      nullPath = QTicket.ticket.externalRequestors.isEmpty();
    }

    return nullPath;
  }

  private static boolean valueInContainsNull(List<String> valueIn) {
    if (valueIn == null) return false;
    return valueIn.contains("null");
  }

  private static List<String> removeNullValueIn(List<String> valueIn) {
    return valueIn == null
        ? Collections.emptyList()
        : valueIn.stream().filter(Objects::nonNull).filter(v -> !v.equals("null")).toList();
  }
}
