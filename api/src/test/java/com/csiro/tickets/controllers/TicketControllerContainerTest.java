package com.csiro.tickets.controllers;

import com.csiro.tickets.TicketTestBaseContainer;
import com.csiro.tickets.helper.SearchCondition;
import com.csiro.tickets.helper.SearchConditionBody;
import com.csiro.tickets.helper.TicketResponse;
import io.restassured.http.ContentType;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class TicketControllerContainerTest extends TicketTestBaseContainer {

  @Test
  void testSearchTicketBodyPagination() {
    SearchConditionBody searchConditionBody = SearchConditionBody.builder().build();

    TicketResponse tr =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(searchConditionBody)
            .post(this.getSnomioLocation() + "/api/tickets/search")
            .then()
            .statusCode(200)
            .extract()
            .as(TicketResponse.class);

    Assertions.assertEquals(20, tr.getEmbedded().getTickets().size());

    Assertions.assertEquals(599, tr.getPage().getTotalPages());

    Assertions.assertEquals(0, tr.getPage().getNumber());

    tr =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(searchConditionBody)
            .post(this.getSnomioLocation() + "/api/tickets/search?page=1&size=20")
            .then()
            .statusCode(200)
            .extract()
            .as(TicketResponse.class);

    Assertions.assertEquals(20, tr.getEmbedded().getTickets().size());

    Assertions.assertEquals(599, tr.getPage().getTotalPages());

    Assertions.assertEquals(1, tr.getPage().getNumber());
  }

  @Test
  void testSearchTicketBody() {

    SearchCondition titleSearchCondition =
        SearchCondition.builder()
            .condition("and")
            .value("zarzio")
            .operation("=")
            .key("title")
            .build();

    SearchConditionBody searchConditionBody =
        SearchConditionBody.builder().searchConditions(List.of(titleSearchCondition)).build();

    TicketResponse tr =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(searchConditionBody)
            .post(this.getSnomioLocation() + "/api/tickets/search")
            .then()
            .statusCode(200)
            .extract()
            .as(TicketResponse.class);

    Assertions.assertEquals(2, tr.getEmbedded().getTickets().size());
  }
}
