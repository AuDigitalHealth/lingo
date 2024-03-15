package com.csiro.tickets.controllers;

import com.csiro.tickets.AdditionalFieldValueDto;
import com.csiro.tickets.JsonFieldDto;
import com.csiro.tickets.TicketMinimalDto;
import com.csiro.tickets.TicketTestBaseContainer;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.helper.AdditionalFieldUtils;
import com.csiro.tickets.helper.JsonReader;
import com.csiro.tickets.helper.SearchCondition;
import com.csiro.tickets.helper.SearchConditionBody;
import com.csiro.tickets.helper.TicketResponse;
import com.csiro.tickets.models.Iteration;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.restassured.http.ContentType;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

public class TicketControllerContainerTest extends TicketTestBaseContainer {

  @Autowired private ObjectMapper mapper;

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
  void createTicketComplex() throws JsonProcessingException {

    String testTicket = JsonReader.readJsonFile("tickets/create-complex.json");
    // add the jsonFieldEntry this way, otherwise create-complex will end up too late and confusing
    // also makes it easier to test it for the update.
    String jsonFieldEntry = JsonReader.readJsonFile("tickets/tga-entry-9979.json");

    TicketMinimalDto ticketMinimalDto = mapper.readValue(testTicket, TicketMinimalDto.class);
    JsonFieldDto jsonFieldDto = JsonFieldDto.builder().name("Tga Entry").build();
    JsonNode jsonNode = mapper.readValue(jsonFieldEntry, JsonNode.class);
    jsonFieldDto.setValue(jsonNode);
    List<JsonFieldDto> jsonFieldDtos = new ArrayList<>();
    jsonFieldDtos.add(jsonFieldDto);
    ticketMinimalDto.setJsonFields(jsonFieldDtos);

    findOrCreateIteration();
    // this ticket intentionally has an artgid that doesn't exist in the db.

    TicketDto responseTicket =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(ticketMinimalDto)
            .post(this.getSnomioLocation() + "/api/tickets")
            .then()
            .statusCode(200)
            .extract()
            .as(TicketDto.class);

    Assertions.assertEquals(responseTicket.getJsonFields().size(), 1);

    testTicketFields(responseTicket);
  }

  void testTicketFields(TicketDto responseTicket) {
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

  @Test
  void updateTicketComplex() throws JsonProcessingException {
    findOrCreateIteration();
    TicketMinimalDto ticketMinimalDto =
        TicketMinimalDto.builder().title("Test").description("test").build();
    JsonFieldDto jsonFieldDto = JsonFieldDto.builder().name("Tga Entry").build();
    List<JsonFieldDto> startJsonFields = new ArrayList<>();
    startJsonFields.add(jsonFieldDto);
    ticketMinimalDto.setJsonFields(startJsonFields);
    TicketDto responseTicket =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(ticketMinimalDto)
            .post(this.getSnomioLocation() + "/api/tickets")
            .then()
            .statusCode(200)
            .extract()
            .as(TicketDto.class);

    Assertions.assertEquals(1, responseTicket.getJsonFields().size());
    JsonFieldDto jsonFieldDtoResponse = responseTicket.getJsonFields().get(0);
    Assertions.assertNull(jsonFieldDtoResponse.getValue().get("EntryType"));
    String testTicket = JsonReader.readJsonFile("tickets/create-complex.json");

    // update the value of the jsonfield, but not the name

    String jsonFieldEntry = JsonReader.readJsonFile("tickets/tga-entry-9979.json");

    TicketMinimalDto ticketMinimalDtoUpdated = mapper.readValue(testTicket, TicketMinimalDto.class);
    JsonFieldDto jsonFieldDtoUpdated = responseTicket.getJsonFields().get(0);
    JsonNode jsonNode = mapper.readValue(jsonFieldEntry, JsonNode.class);
    jsonFieldDtoUpdated.setValue(jsonNode);
    List<JsonFieldDto> jsonFieldDtos = new ArrayList<>();
    jsonFieldDtos.add(jsonFieldDtoUpdated);
    ticketMinimalDtoUpdated.setJsonFields(jsonFieldDtos);

    TicketDto updateResponseTicket =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(ticketMinimalDtoUpdated)
            .put(this.getSnomioLocation() + "/api/tickets/" + responseTicket.getId())
            .then()
            .statusCode(200)
            .extract()
            .as(TicketDto.class);

    Assertions.assertEquals(updateResponseTicket.getJsonFields().size(), 1);

    JsonFieldDto jsonFieldDtoUpdatedResponse = updateResponseTicket.getJsonFields().get(0);
    Assertions.assertNotNull(jsonFieldDtoUpdatedResponse.getValue().get("EntryType"));
    testTicketFields(responseTicket);
  }

  private void findOrCreateIteration() throws JsonProcessingException {

    List<Iteration> iterations =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .get(this.getSnomioLocation() + "/api/tickets/iterations")
            .then()
            .statusCode(200)
            .extract()
            .jsonPath()
            .getList(".", Iteration.class);

    if (iterations.size() > 0) {
      return;
    }

    String testIteration = JsonReader.readJsonFile("tickets/basic-iteration.json");

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
  }
}
