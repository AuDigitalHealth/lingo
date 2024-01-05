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

    Assertions.assertEquals(tr.getEmbedded().getTickets().size(), 20);

    Assertions.assertEquals(tr.getPage().getTotalPages(), 599);

    Assertions.assertEquals(tr.getPage().getNumber(), 0);

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

    Assertions.assertEquals(tr.getEmbedded().getTickets().size(), 20);

    Assertions.assertEquals(tr.getPage().getTotalPages(), 599);

    Assertions.assertEquals(tr.getPage().getNumber(), 1);
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

    Assertions.assertEquals(tr.getEmbedded().getTickets().size(), 2);
  }
}
