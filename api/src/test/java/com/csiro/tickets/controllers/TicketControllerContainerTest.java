package com.csiro.tickets.controllers;

import com.csiro.tickets.AdditionalFieldValueDto;
import com.csiro.tickets.TicketTestBaseContainer;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.helper.AdditionalFieldUtils;
import com.csiro.tickets.helper.JsonReader;
import com.csiro.tickets.helper.SearchCondition;
import com.csiro.tickets.helper.SearchConditionBody;
import com.csiro.tickets.helper.TicketResponse;
import com.csiro.tickets.models.Iteration;
import io.restassured.http.ContentType;
import java.util.List;
import java.util.Set;
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

    Assertions.assertEquals(2529, tr.getPage().getTotalPages());

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

    Assertions.assertEquals(2529, tr.getPage().getTotalPages());

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

  @Test
  void createTicketComplex() {
    String testIteration = JsonReader.readJsonFile("tickets/basic-iteration.json");
    String testTicket = JsonReader.readJsonFile("tickets/create-complex.json");

    Iteration iteration =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(testIteration)
            .post(this.getSnomioLocation() + "/api/tickets/iterations")
            .then()
            .statusCode(200)
            .extract()
            .as(Iteration.class);

    System.out.println(iteration.getName());

    // this ticket intentionally has an artgid that doesn't exist in the db.

    TicketDto responseTicket =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(testTicket)
            .post(this.getSnomioLocation() + "/api/tickets")
            .then()
            .statusCode(200)
            .extract()
            .as(TicketDto.class);

    Assertions.assertEquals(
        responseTicket.getTitle(),
        "TGA - ARTG ID 9979 ZOFRAN ondansetron (as hydrochloride dihydrate) 4mg tablet blister pack");
    Assertions.assertEquals(responseTicket.getAssignee(), "cgillespie");

    Assertions.assertEquals(responseTicket.getLabels().size(), 1);
    Assertions.assertEquals(responseTicket.getLabels().get(0).getName(), "JiraExport");

    Assertions.assertEquals(responseTicket.getState().getLabel(), "Closed");
    Assertions.assertEquals(responseTicket.getSchedule().getName(), "S4");

    Set<AdditionalFieldValueDto> additionalFieldValueDtoSet =
        responseTicket.getAdditionalFieldValues();
    Assertions.assertEquals(responseTicket.getAdditionalFieldValues().size(), 5);
    Assertions.assertEquals(
        AdditionalFieldUtils.getAdditionalFieldValueByTypeName(
            additionalFieldValueDtoSet, "ARTGID"),
        "69696969");
    Assertions.assertEquals(
        AdditionalFieldUtils.getAdditionalFieldValueByTypeName(
            additionalFieldValueDtoSet, "StartDate"),
        "1991-04-17T00:00:00.000+10:00");
    Assertions.assertEquals(
        AdditionalFieldUtils.getAdditionalFieldValueByTypeName(
            additionalFieldValueDtoSet, "EffectiveDate"),
        "2019-12-05T00:00:00.000+10:00");
    Assertions.assertEquals(
        AdditionalFieldUtils.getAdditionalFieldValueByTypeName(
            additionalFieldValueDtoSet, "AMTFlags"),
        "PBS");
    Assertions.assertEquals(
        AdditionalFieldUtils.getAdditionalFieldValueByTypeName(
            additionalFieldValueDtoSet, "TGAEntryHash"),
        "12345");
  }
}
