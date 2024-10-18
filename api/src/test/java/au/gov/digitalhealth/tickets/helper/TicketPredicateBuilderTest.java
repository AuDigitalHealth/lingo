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

    SearchCondition ticketNumberSearchCondition =
        SearchCondition.builder()
            .condition("or")
            .value("ticketNumberTest")
            .operation("=")
            .key("ticketNumber")
            .build();

    titleSearchCondition.setCondition("or");

    BooleanBuilder titleAndComments =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(
            List.of(titleSearchCondition, commentSearchCondition, ticketNumberSearchCondition));
    Assertions.assertEquals(
        "containsIc(ticket.title,titleTest) || containsIc(any(ticket.comments).text,commentTest) || containsIc(ticket.ticketNumber,ticketNumberTest)",
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

    SearchCondition labelSearchCondition =
        SearchCondition.builder()
            .condition("or")
            .value(null)
            .valueIn("[labelsTest]")
            .operation("=")
            .key("labels.name")
            .build();

    BooleanBuilder labels =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(List.of(labelSearchCondition));
    Assertions.assertEquals("any(ticket.labels).name = labelsTest", labels.getValue().toString());

    SearchCondition externalRequestorSearchCondition =
        SearchCondition.builder()
            .condition("or")
            .valueIn("[externalRequestorTest]")
            .operation("=")
            .key("externalRequestors.name")
            .build();

    BooleanBuilder externalRequestor =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(
            List.of(externalRequestorSearchCondition));
    Assertions.assertEquals(
        "any(ticket.externalRequestors).name = externalRequestorTest",
        externalRequestor.getValue().toString());

    SearchCondition scheduleSearchCondition =
        SearchCondition.builder()
            .condition("and")
            .value("scheduleTest")
            .operation("=")
            .key("schedule.name")
            .build();

    BooleanBuilder schedule =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(List.of(scheduleSearchCondition));
    Assertions.assertEquals(
        "containsIc(ticket.schedule.name,scheduleTest)", schedule.getValue().toString());

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
                ticketNumberSearchCondition,
                commentSearchCondition,
                prioritySearchCondition,
                scheduleSearchCondition,
                iterationSearchCondition,
                stateSearchCondition,
                taskCondition,
                assigneeCondition,
                createdCondition));
    Assertions.assertEquals(
        "(containsIc(ticket.title,titleTest) || containsIc(ticket.ticketNumber,ticketNumberTest) || containsIc(any(ticket.comments).text,commentTest)) && containsIc(ticket.priorityBucket.name,priorityTest) && containsIc(ticket.schedule.name,scheduleTest) && containsIc(ticket.iteration.name,iterationTest) && containsIc(ticket.state.label,stateTest) && containsIc(ticket.taskAssociation.taskId,taskTest) && ticket.assignee in [assigneeTest1, assigneeTest2] && ticket.created between 2023-12-31T14:00:00Z and 2024-01-03T14:00:00Z",
        together.getValue().toString());
  }

  @Test
  void buildPredicateFromSearchConditionsAssignee() {

    // Search title
    SearchCondition assigneeSearchCondition =
        SearchCondition.builder()
            .condition("and")
            .valueIn("[null, assignee1]")
            .operation("=")
            .key("assignee")
            .build();

    BooleanBuilder assigneeBoolean =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(List.of(assigneeSearchCondition));

    Assertions.assertEquals(
        "ticket.assignee = assignee1 || ticket.assignee is null",
        assigneeBoolean.getValue().toString());

    SearchCondition assigneeSearchCondition2 =
        SearchCondition.builder()
            .condition("and")
            .valueIn("[null, assignee1, assignee2]")
            .operation("=")
            .key("assignee")
            .build();

    BooleanBuilder assigneeBoolean2 =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(
            List.of(assigneeSearchCondition2));

    Assertions.assertEquals(
        "ticket.assignee in [assignee1, assignee2] || ticket.assignee is null",
        assigneeBoolean2.getValue().toString());
  }

  @Test
  void buildPredicateFromSearchConditionsCreated() {

    // Search title
    SearchCondition createdSearchCondition =
        SearchCondition.builder()
            .condition("and")
            .value("13/10/23")
            .operation("=")
            .key("created")
            .build();

    BooleanBuilder assigneeBoolean =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(List.of(createdSearchCondition));

    Assertions.assertEquals(
        "ticket.created between 2023-10-12T14:00:00Z and 2023-10-13T13:59:59.999Z",
        assigneeBoolean.getValue().toString());

    SearchCondition createdSearchCondition4 =
        SearchCondition.builder()
            .condition("and")
            .value("13/10/23")
            .operation("!=")
            .key("created")
            .build();

    BooleanBuilder createdBoolean4 =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(List.of(createdSearchCondition4));

    Assertions.assertEquals(
        "!(ticket.created between 2023-10-12T14:00:00Z and 2023-10-13T13:59:59.999Z)",
        createdBoolean4.getValue().toString());

    SearchCondition createdSearchCondition2 =
        SearchCondition.builder()
            .condition("and")
            .value("13/10/23")
            .operation(">=")
            .key("created")
            .build();

    BooleanBuilder createdBoolean2 =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(List.of(createdSearchCondition2));

    Assertions.assertEquals(
        "ticket.created > 2023-10-13T13:59:59.999Z", createdBoolean2.getValue().toString());

    SearchCondition createdSearchCondition3 =
        SearchCondition.builder()
            .condition("and")
            .value("13/10/23")
            .operation("<=")
            .key("created")
            .build();

    BooleanBuilder createdBoolean3 =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(List.of(createdSearchCondition3));

    Assertions.assertEquals(
        "ticket.created < 2023-10-12T14:00:00Z", createdBoolean3.getValue().toString());
  }

  @Test
  void buildPredicteFromNullConditions() {

    SearchCondition prioritySearchConditionWithoutNull =
        SearchCondition.builder()
            .condition("and")
            .valueIn("[priorityTest]")
            .operation("=")
            .key("priorityBucket.name")
            .build();

    BooleanBuilder priorityWithoutNull =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(
            List.of(prioritySearchConditionWithoutNull));
    Assertions.assertEquals(
        "ticket.priorityBucket.name = priorityTest", priorityWithoutNull.getValue().toString());

    SearchCondition prioritySearchCondition =
        SearchCondition.builder()
            .condition("and")
            .valueIn("[priorityTest, null]")
            .operation("=")
            .key("priorityBucket.name")
            .build();

    BooleanBuilder priority =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(List.of(prioritySearchCondition));
    Assertions.assertEquals(
        "ticket.priorityBucket.name = priorityTest || ticket.priorityBucket is null",
        priority.getValue().toString());

    SearchCondition scheduleSearchCondition =
        SearchCondition.builder()
            .condition("and")
            .valueIn("[scheduleTest, null]")
            .operation("=")
            .key("schedule.name")
            .build();

    BooleanBuilder schedule =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(List.of(scheduleSearchCondition));
    Assertions.assertEquals(
        "ticket.schedule.name = scheduleTest || ticket.schedule is null",
        schedule.getValue().toString());

    SearchCondition iterationSearchCondition =
        SearchCondition.builder()
            .condition("and")
            .valueIn("[iterationTest, null]")
            .operation("=")
            .key("iteration.name")
            .build();

    BooleanBuilder iteration =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(
            List.of(iterationSearchCondition));
    Assertions.assertEquals(
        "ticket.iteration.name = iterationTest || ticket.iteration is null",
        iteration.getValue().toString());

    SearchCondition stateSearchCondition =
        SearchCondition.builder()
            .condition("and")
            .valueIn("[stateTest, null]")
            .operation("=")
            .key("state.label")
            .build();

    BooleanBuilder state =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(List.of(stateSearchCondition));
    Assertions.assertEquals(
        "ticket.state.label = stateTest || ticket.state is null", state.getValue().toString());

    SearchCondition taskCondition =
        SearchCondition.builder()
            .condition("and")
            .valueIn("[taskTest, null]")
            .operation("=")
            .key("taskAssociation.taskId")
            .build();

    BooleanBuilder task =
        TicketPredicateBuilder.buildPredicateFromSearchConditions(List.of(taskCondition));
    Assertions.assertEquals(
        "ticket.taskAssociation.taskId = taskTest || ticket.taskAssociation is null",
        task.getValue().toString());
  }
}
