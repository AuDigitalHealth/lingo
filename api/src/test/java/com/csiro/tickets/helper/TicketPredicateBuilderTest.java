package com.csiro.tickets.helper;

import com.querydsl.core.BooleanBuilder;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class TicketPredicateBuilderTest {

  @Test
  void buildPredicateFromSearchConditions() {

    // Search title
    SearchCondition titleSearchCondition =
        SearchCondition.builder()
            .condition("and")
            .value("titleTest")
            .operation("=")
            .key("title")
            .build();

    BooleanBuilder titleBoolean =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(List.of(titleSearchCondition));

    Assertions.assertEquals(
        "containsIc(ticket.title,titleTest)", titleBoolean.getValue().toString());

    // Search title and comments
    SearchCondition commentSearchCondition =
        SearchCondition.builder()
            .condition("or")
            .value("commentTest")
            .operation("=")
            .key("comments.text")
            .build();

    titleSearchCondition.setCondition("or");

    BooleanBuilder titleAndComments =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(
            List.of(titleSearchCondition, commentSearchCondition));
    Assertions.assertEquals(
        "containsIc(ticket.title,titleTest) || containsIc(any(ticket.comments).text,commentTest)",
        titleAndComments.getValue().toString());

    SearchCondition prioritySearchCondition =
        SearchCondition.builder()
            .condition("and")
            .value("priorityTest")
            .operation("=")
            .key("priorityBucket.name")
            .build();

    BooleanBuilder priority =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(List.of(prioritySearchCondition));
    Assertions.assertEquals(
        "containsIc(ticket.priorityBucket.name,priorityTest)", priority.getValue().toString());

    SearchCondition scheduleSearchCondition =
        SearchCondition.builder()
            .condition("and")
            .value("scheduleTest")
            .operation("=")
            .key("additionalFieldValues.valueOf")
            .build();

    BooleanBuilder schedule =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(List.of(scheduleSearchCondition));
    Assertions.assertEquals(
        "containsIc(any(ticket.additionalFieldValues).valueOf,scheduleTest)",
        schedule.getValue().toString());

    SearchCondition iterationSearchCondition =
        SearchCondition.builder()
            .condition("and")
            .value("iterationTest")
            .operation("=")
            .key("iteration.name")
            .build();

    BooleanBuilder iteration =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(
            List.of(iterationSearchCondition));
    Assertions.assertEquals(
        "containsIc(ticket.iteration.name,iterationTest)", iteration.getValue().toString());

    SearchCondition stateSearchCondition =
        SearchCondition.builder()
            .condition("and")
            .value("stateTest")
            .operation("=")
            .key("state.label")
            .build();

    BooleanBuilder state =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(List.of(stateSearchCondition));
    Assertions.assertEquals(
        "containsIc(ticket.state.label,stateTest)", state.getValue().toString());

    SearchCondition taskCondition =
        SearchCondition.builder()
            .condition("and")
            .value("taskTest")
            .operation("=")
            .key("taskAssociation.taskId")
            .build();

    BooleanBuilder task =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(List.of(taskCondition));
    Assertions.assertEquals(
        "containsIc(ticket.taskAssociation.taskId,taskTest)", task.getValue().toString());

    SearchCondition assigneeCondition =
        SearchCondition.builder()
            .condition("and")
            .valueIn("[assigneeTest1, assigneeTest2]")
            .operation("=")
            .key("assignee")
            .build();

    BooleanBuilder assignee =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(List.of(assigneeCondition));
    Assertions.assertEquals(
        "ticket.assignee in [assigneeTest1, assigneeTest2]", assignee.getValue().toString());

    SearchCondition createdCondition =
        SearchCondition.builder()
            .condition("and")
            .value("01/01/24-04/01/24")
            .operation("=")
            .key("created")
            .build();

    BooleanBuilder created =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(List.of(createdCondition));
    Assertions.assertEquals(
        "ticket.created between 2023-12-31T14:00:00Z and 2024-01-03T14:00:00Z",
        created.getValue().toString());

    SearchCondition createdCondition2 =
        SearchCondition.builder()
            .condition("and")
            .value("01/01/24")
            .operation("=")
            .key("created")
            .build();

    BooleanBuilder created2 =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(List.of(createdCondition2));
    Assertions.assertEquals(
        "ticket.created between 2023-12-31T14:00:00Z and 2024-01-01T13:59:59.999Z",
        created2.getValue().toString());

    // all together
    BooleanBuilder together =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(
            List.of(
                titleSearchCondition,
                commentSearchCondition,
                prioritySearchCondition,
                scheduleSearchCondition,
                iterationSearchCondition,
                stateSearchCondition,
                taskCondition,
                assigneeCondition,
                createdCondition));
    Assertions.assertEquals(
        "(containsIc(ticket.title,titleTest) || containsIc(any(ticket.comments).text,commentTest)) && containsIc(ticket.priorityBucket.name,priorityTest) && containsIc(any(ticket.additionalFieldValues).valueOf,scheduleTest) && containsIc(ticket.iteration.name,iterationTest) && containsIc(ticket.state.label,stateTest) && containsIc(ticket.taskAssociation.taskId,taskTest) && ticket.assignee in [assigneeTest1, assigneeTest2] && ticket.created between 2023-12-31T14:00:00Z and 2024-01-03T14:00:00Z",
        together.getValue().toString());
  }
}
