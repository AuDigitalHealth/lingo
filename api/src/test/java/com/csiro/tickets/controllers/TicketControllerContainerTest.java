package com.csiro.tickets.controllers;

import static com.github.tomakehurst.wiremock.client.WireMock.configureFor;

import com.csiro.snomio.config.SergioMockConfig;
import com.csiro.tickets.*;
import com.csiro.tickets.helper.AdditionalFieldUtils;
import com.csiro.tickets.helper.JsonReader;
import com.csiro.tickets.helper.PbsRequest;
import com.csiro.tickets.helper.PbsRequestResponse;
import com.csiro.tickets.helper.SearchCondition;
import com.csiro.tickets.helper.SearchConditionBody;
import com.csiro.tickets.helper.TicketResponse;
import com.csiro.tickets.models.ExternalRequestor;
import com.csiro.tickets.models.Iteration;
import com.csiro.tickets.repository.ExternalRequestorRepository;
import com.csiro.tickets.repository.TicketRepository;
import com.csiro.tickets.service.TicketServiceImpl;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.WireMockServer;
import io.restassured.http.ContentType;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@ExtendWith(MockitoExtension.class)
public class TicketControllerContainerTest extends TicketTestBaseContainer {

  @Autowired private ObjectMapper mapper;
  @Autowired private TicketRepository ticketRepository;
  @Autowired private ExternalRequestorRepository externalRequestorRepository;
  @Autowired private TicketServiceImpl ticketService;

  @DynamicPropertySource
  public static void dynamicProperties(DynamicPropertyRegistry registry) {
    WireMockServer sergioMockServer = SergioMockConfig.wireMockServer();
    int wireMockPort = sergioMockServer.port();
    registry.add("sergio.base.url", () -> "http://localhost:" + wireMockPort);
    configureFor("localhost", wireMockPort);
    System.setProperty("sergio.base.url", "http://localhost:" + wireMockPort);
  }

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

    TicketDto ticketDto = mapper.readValue(testTicket, TicketDto.class);
    JsonFieldDto jsonFieldDto =
        JsonFieldDto.builder().name(TicketMinimalDto.TGA_ENTRY_FIELD_NAME).build();
    JsonNode jsonNode = mapper.readValue(jsonFieldEntry, JsonNode.class);
    jsonFieldDto.setValue(jsonNode);
    Set<JsonFieldDto> jsonFieldDtos = new HashSet<>();
    jsonFieldDtos.add(jsonFieldDto);
    ticketDto.setJsonFields(jsonFieldDtos);

    findOrCreateIteration();
    // this ticket intentionally has an artgid that doesn't exist in the db.

    TicketDto responseTicket =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(ticketDto)
            .post(this.getSnomioLocation() + "/api/tickets")
            .then()
            .statusCode(200)
            .extract()
            .as(TicketDto.class);

    Assertions.assertEquals(1, responseTicket.getJsonFields().size());

    testTicketFields(responseTicket);
  }

  void testTicketFields(TicketDto responseTicket) {
    Assertions.assertEquals(
        "TGA - ARTG ID 9979 ZOFRAN ondansetron (as hydrochloride dihydrate) 4mg tablet blister pack",
        responseTicket.getTitle());
    Assertions.assertEquals("cgillespie", responseTicket.getAssignee());

    Assertions.assertEquals(1, responseTicket.getLabels().size());
    Assertions.assertEquals("JiraExport", responseTicket.getLabels().iterator().next().getName());

    Assertions.assertEquals("Closed", responseTicket.getState().getLabel());
    Assertions.assertEquals("S4", responseTicket.getSchedule().getName());

    Set<AdditionalFieldValueDto> additionalFieldValueDtoSet =
        responseTicket.getAdditionalFieldValues();
    Assertions.assertEquals(5, responseTicket.getAdditionalFieldValues().size());
    Assertions.assertEquals(
        "69696969",
        AdditionalFieldUtils.getAdditionalFieldValueByTypeName(
            additionalFieldValueDtoSet, TicketDto.ARTGID_ADDITIONAL_FIELD_TYPE));
    Assertions.assertEquals(
        "1991-04-17T00:00:00.000+10:00",
        AdditionalFieldUtils.getAdditionalFieldValueByTypeName(
            additionalFieldValueDtoSet, "StartDate"));
    Assertions.assertEquals(
        "2019-12-05T00:00:00.000+10:00",
        AdditionalFieldUtils.getAdditionalFieldValueByTypeName(
            additionalFieldValueDtoSet, "EffectiveDate"));
    Assertions.assertEquals(
        "PBS",
        AdditionalFieldUtils.getAdditionalFieldValueByTypeName(
            additionalFieldValueDtoSet, "AMTFlags"));
    Assertions.assertEquals(
        "12345",
        AdditionalFieldUtils.getAdditionalFieldValueByTypeName(
            additionalFieldValueDtoSet, "TGAEntryHash"));
  }

  @Test
  void updateTicketComplex() throws JsonProcessingException {
    findOrCreateIteration();
    TicketDto ticketDto = TicketDto.builder().title("Test").description("test").build();
    JsonFieldDto jsonFieldDto = JsonFieldDto.builder().name("Tga Entry").build();
    Set<JsonFieldDto> startJsonFields = new HashSet<>();
    startJsonFields.add(jsonFieldDto);
    ticketDto.setJsonFields(startJsonFields);
    TicketDto responseTicket =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(ticketDto)
            .post(this.getSnomioLocation() + "/api/tickets")
            .then()
            .statusCode(200)
            .extract()
            .as(TicketDto.class);

    Assertions.assertEquals(1, responseTicket.getJsonFields().size());
    JsonFieldDto jsonFieldDtoResponse = responseTicket.getJsonFields().iterator().next();
    Assertions.assertNull(jsonFieldDtoResponse.getValue().get("EntryType"));
    String testTicket = JsonReader.readJsonFile("tickets/create-complex.json");

    // update the value of the jsonfield, but not the name

    String jsonFieldEntry = JsonReader.readJsonFile("tickets/tga-entry-9979.json");

    TicketMinimalDto ticketDtoUpdated = mapper.readValue(testTicket, TicketDto.class);
    JsonFieldDto jsonFieldDtoUpdated = responseTicket.getJsonFields().iterator().next();
    JsonNode jsonNode = mapper.readValue(jsonFieldEntry, JsonNode.class);
    jsonFieldDtoUpdated.setValue(jsonNode);
    Set<JsonFieldDto> jsonFieldDtos = new HashSet<>();
    jsonFieldDtos.add(jsonFieldDtoUpdated);
    ticketDtoUpdated.setJsonFields(jsonFieldDtos);

    TicketDto updateResponseTicket =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(ticketDtoUpdated)
            .put(this.getSnomioLocation() + "/api/tickets/" + responseTicket.getId())
            .then()
            .statusCode(200)
            .extract()
            .as(TicketDto.class);

    Assertions.assertEquals(1, updateResponseTicket.getJsonFields().size());

    JsonFieldDto jsonFieldDtoUpdatedResponse =
        updateResponseTicket.getJsonFields().iterator().next();
    Assertions.assertNotNull(jsonFieldDtoUpdatedResponse.getValue().get("EntryType"));
    testTicketFields(updateResponseTicket);
  }

  @Test
  void testPbsRequest() throws JsonProcessingException {
    // Make sure PBS external requester exists create if needed
    Optional<ExternalRequestor> externalRequestorOptional =
        externalRequestorRepository.findByName("PBS");
    if (!externalRequestorOptional.isPresent()) {
      ExternalRequestor externalRequestor =
          ExternalRequestor.builder()
              .name("PBS")
              .description("PBS")
              .displayColor("success")
              .build();
      withAuth()
          .contentType(ContentType.JSON)
          .when()
          .body(externalRequestor)
          .post(this.getSnomioLocation() + "/api/tickets/externalRequestors")
          .then()
          .statusCode(200);
    }

    // new ticket needs to be created through sergio, this artgid doesn't exist in the db
    String newPbsRequestString = JsonReader.readJsonFile("tickets/pbs-request-new.json");
    PbsRequest newPbsRequest = mapper.readValue(newPbsRequestString, PbsRequest.class);
    String newPbsRequestSergioResponse =
        JsonReader.readJsonFile("tickets/pbs-request-new-sergio-response.json");

    SergioMockConfig.stubSergioResponse(newPbsRequest.getArtgid(), newPbsRequestSergioResponse);
    PbsRequestResponse pbsRequestResponse =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(newPbsRequest)
            .post(this.getSnomioLocation() + "/api/tickets/pbsRequest")
            .then()
            .statusCode(201)
            .extract()
            .as(PbsRequestResponse.class);

    Assertions.assertNotNull(pbsRequestResponse);
    Assertions.assertEquals(443270L, pbsRequestResponse.getProductSubmission().getArtgid());
    Assertions.assertEquals(
        "TGA - ARTG ID 443270 STROING'EM capsules",
        pbsRequestResponse.getProductSubmission().getName());

    // already exists, mark it as a pbs ticket
    String markAsPbsRequestedString =
        JsonReader.readJsonFile("tickets/pbs-request-mark-as-pbs.json");
    PbsRequest markAsPbsRequested = mapper.readValue(markAsPbsRequestedString, PbsRequest.class);

    PbsRequestResponse markAsPbsRequestedResponse =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(markAsPbsRequested)
            .post(this.getSnomioLocation() + "/api/tickets/pbsRequest")
            .then()
            .statusCode(201)
            .extract()
            .as(PbsRequestResponse.class);
    //
    Assertions.assertNotNull(markAsPbsRequestedResponse);
    // check the pbs requested label is now there

    TicketDtoExtended ticketWithPbsExternalRequester =
        ticketService.findTicket(markAsPbsRequestedResponse.getId());
    ticketWithPbsExternalRequester.getExternalRequestors().stream()
        .filter(requestor -> requestor.getName().equals("PBS"))
        .findAny()
        .orElseThrow();
    // now we can get the status of this request
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(
            this.getSnomioLocation()
                + String.format("/api/tickets/%s/pbsRequest", markAsPbsRequestedResponse.getId()))
        .then()
        .statusCode(200)
        .extract()
        .as(PbsRequestResponse.class);

    // where as a random ticket this isn't a pbs ticket, will throw 500

    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .body(markAsPbsRequested)
        .get(this.getSnomioLocation() + "/api/tickets/1/pbsRequest")
        .then()
        .statusCode(404);
  }

  private void findOrCreateIteration() {

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

    if (!iterations.isEmpty()) {
      return;
    }

    String testIteration = JsonReader.readJsonFile("tickets/basic-iteration.json");

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
