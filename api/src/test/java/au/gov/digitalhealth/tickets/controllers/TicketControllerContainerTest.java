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
package au.gov.digitalhealth.tickets.controllers;

import static com.github.tomakehurst.wiremock.client.WireMock.configureFor;

import au.gov.digitalhealth.lingo.config.SergioMockConfig;
import au.gov.digitalhealth.tickets.AdditionalFieldValueDto;
import au.gov.digitalhealth.tickets.JsonFieldDto;
import au.gov.digitalhealth.tickets.TicketDto;
import au.gov.digitalhealth.tickets.TicketDtoExtended;
import au.gov.digitalhealth.tickets.TicketMinimalDto;
import au.gov.digitalhealth.tickets.TicketTestBaseContainer;
import au.gov.digitalhealth.tickets.helper.AdditionalFieldUtils;
import au.gov.digitalhealth.tickets.helper.JsonReader;
import au.gov.digitalhealth.tickets.helper.SearchCondition;
import au.gov.digitalhealth.tickets.helper.SearchConditionBody;
import au.gov.digitalhealth.tickets.helper.TicketMetadata;
import au.gov.digitalhealth.tickets.helper.TicketResponse;
import au.gov.digitalhealth.tickets.helper.TicketSubmissionResponse;
import au.gov.digitalhealth.tickets.models.ExternalRequestor;
import au.gov.digitalhealth.tickets.models.Iteration;
import au.gov.digitalhealth.tickets.models.Label;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.repository.ExternalRequestorRepository;
import au.gov.digitalhealth.tickets.repository.LabelRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import au.gov.digitalhealth.tickets.service.TicketServiceImpl;
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
  @Autowired private LabelRepository labelRepository;
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
    for (int i = 0; i < 100; i++) {
      createTicket(
          "test title-" + i, "test description-" + i, TicketMinimalDto.TGA_ENTRY_FIELD_NAME);
    }
    List<Ticket> allTickets =
        ticketRepository
            .findAll(); // Can't predict the Total tickets being created in the order of test being
    // run
    int pageSize = 20;
    int totalPages = (allTickets.size() + pageSize - 1) / pageSize;

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

    Assertions.assertEquals(pageSize, tr.getEmbedded().getTickets().size());

    Assertions.assertEquals(totalPages, tr.getPage().getTotalPages());

    Assertions.assertEquals(0, tr.getPage().getNumber());

    tr =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(searchConditionBody)
            .post(this.getSnomioLocation() + "/api/tickets/search?page=1&size=" + pageSize)
            .then()
            .statusCode(200)
            .extract()
            .as(TicketResponse.class);

    Assertions.assertEquals(pageSize, tr.getEmbedded().getTickets().size());

    Assertions.assertEquals(totalPages, tr.getPage().getTotalPages());

    Assertions.assertEquals(1, tr.getPage().getNumber());
  }

  @Test
  void testSearchTicketBody() {
    String title = "Test Title";
    String description = "Test Description";
    createTicket(title, description, TicketMinimalDto.TGA_ENTRY_FIELD_NAME);

    SearchCondition titleSearchCondition =
        SearchCondition.builder().condition("and").value(title).operation("=").key("title").build();

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

    Assertions.assertEquals(1, tr.getEmbedded().getTickets().size());
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
    Assertions.assertEquals(4, responseTicket.getAdditionalFieldValues().size());
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
  void testCreateOrGetTicket() throws JsonProcessingException {
    // Ensure PBS external requester and labels exist
    ensureExternalRequestorExists("PBS", "PBS", "success");
    ensureLabelExists("PBSRequest", "PBS Request Label");
    ensureLabelExists("Urgent", "Urgent Label");

    // new ticket needs to be created through sergio, this dedupeKey doesn't exist in the db
    String newPbsRequestString = JsonReader.readJsonFile("tickets/pbs-request-new.json");
    TicketMetadata newRequest = mapper.readValue(newPbsRequestString, TicketMetadata.class);
    String newPbsRequestSergioResponse =
        JsonReader.readJsonFile("tickets/pbs-request-new-sergio-response.json");

    SergioMockConfig.stubSergioResponse(
        Long.valueOf(newRequest.getDedupeKey()), newPbsRequestSergioResponse);
    TicketSubmissionResponse ticketSubmissionResponse =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(newRequest)
            .post(this.getSnomioLocation() + "/api/tickets/request")
            .then()
            .statusCode(201)
            .extract()
            .as(TicketSubmissionResponse.class);

    Assertions.assertNotNull(ticketSubmissionResponse);
    Assertions.assertNotNull(ticketSubmissionResponse.getTicketId());
    Assertions.assertNotNull(ticketSubmissionResponse.getTicketNumber());

    createTicketComplex();

    // The ticket with ARTG ID 69696969 exists but is Closed — a new one will be created via Sergio
    String markAsPbsRequestedString =
        JsonReader.readJsonFile("tickets/pbs-request-mark-as-pbs.json");
    TicketMetadata markAsPbsRequested =
        mapper.readValue(markAsPbsRequestedString, TicketMetadata.class);
    markAsPbsRequested.setLabels(List.of("PBSRequest", "Urgent"));

    String markAsPbsSergioResponse =
        JsonReader.readJsonFile("tickets/pbs-request-mark-as-pbs-sergio-response.json");
    SergioMockConfig.stubSergioResponse(
        Long.valueOf(markAsPbsRequested.getDedupeKey()), markAsPbsSergioResponse);

    TicketSubmissionResponse markAsPbsRequestedResponse =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(markAsPbsRequested)
            .post(this.getSnomioLocation() + "/api/tickets/request")
            .then()
            .statusCode(201)
            .extract()
            .as(TicketSubmissionResponse.class);

    Assertions.assertNotNull(markAsPbsRequestedResponse);

    // check the external requester and labels are on the ticket
    TicketDtoExtended ticketWithPbsExternalRequester =
        ticketService.findTicket(markAsPbsRequestedResponse.getTicketId());
    ticketWithPbsExternalRequester.getExternalRequestors().stream()
        .filter(requestor -> requestor.getName().equals("PBS"))
        .findAny()
        .orElseThrow();
    Assertions.assertTrue(
        ticketWithPbsExternalRequester.getLabels().stream()
            .anyMatch(label -> label.getName().equals("PBSRequest")));
    Assertions.assertTrue(
        ticketWithPbsExternalRequester.getLabels().stream()
            .anyMatch(label -> label.getName().equals("Urgent")));

    // now we can get the status of this ticket
    TicketSubmissionResponse statusResponse =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .get(
                this.getSnomioLocation()
                    + String.format(
                        "/api/tickets/%s/status", markAsPbsRequestedResponse.getTicketNumber()))
            .then()
            .statusCode(200)
            .extract()
            .as(TicketSubmissionResponse.class);

    Assertions.assertNotNull(statusResponse);
    Assertions.assertEquals(markAsPbsRequestedResponse.getTicketId(), statusResponse.getTicketId());
  }

  @Test
  void testCreateOrGetTicketExistingTicketWithSameTitleAndExternalRequestor()
      throws JsonProcessingException {
    // Ensure PBS external requestor and labels exist
    ensureExternalRequestorExists("PBS", "PBS", "success");
    ensureLabelExists("PBSRequest", "PBS Request Label");

    // Create first request without dedupeKey - this should create a new ticket
    String requestString = JsonReader.readJsonFile("tickets/pbs-request-no-artgid.json");
    TicketMetadata ticketMetadata = mapper.readValue(requestString, TicketMetadata.class);
    ticketMetadata.setLabels(List.of("PBSRequest"));

    TicketSubmissionResponse firstResponse =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(ticketMetadata)
            .post(this.getSnomioLocation() + "/api/tickets/request")
            .then()
            .statusCode(201)
            .extract()
            .as(TicketSubmissionResponse.class);

    Assertions.assertNotNull(firstResponse);
    Long firstTicketId = firstResponse.getTicketId();
    Assertions.assertNotNull(firstTicketId);

    // Verify label was added to the ticket
    TicketDtoExtended firstTicket = ticketService.findTicket(firstTicketId);
    Assertions.assertTrue(
        firstTicket.getLabels().stream().anyMatch(label -> label.getName().equals("PBSRequest")));

    // Make the same request again with same title and externalRequestor
    // This should return the existing ticket instead of creating a new one
    TicketSubmissionResponse secondResponse =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(ticketMetadata)
            .post(this.getSnomioLocation() + "/api/tickets/request")
            .then()
            .statusCode(201)
            .extract()
            .as(TicketSubmissionResponse.class);

    Assertions.assertNotNull(secondResponse);
    // Should return the same ticket ID as the first request
    Assertions.assertEquals(firstTicketId, secondResponse.getTicketId());

    // Verify only one ticket exists with this title
    Optional<Ticket> ticket = ticketRepository.findByTitle(ticketMetadata.getName());
    Assertions.assertTrue(ticket.isPresent());
    Assertions.assertEquals(firstTicketId, ticket.get().getId());
  }

  @Test
  void testCreateOrGetTicketDifferentExternalRequestorCreatesSeparateTicket()
      throws JsonProcessingException {
    // Ensure PBS and TGA external requestors and labels exist
    ensureExternalRequestorExists("PBS", "PBS", "success");
    ensureExternalRequestorExists("TGA", "TGA", "primary");
    ensureLabelExists("PBSRequest", "PBS Request Label");
    ensureLabelExists("TGARequest", "TGA Request Label");

    String uniqueTitle = "Test Different Requestor " + System.currentTimeMillis();

    // Create first request with PBS and PBSRequest label
    TicketMetadata pbsRequest =
        TicketMetadata.builder()
            .name(uniqueTitle)
            .description("PBS description")
            .externalRequestors(List.of("PBS"))
            .labels(List.of("PBSRequest"))
            .build();

    TicketSubmissionResponse pbsResponse =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(pbsRequest)
            .post(this.getSnomioLocation() + "/api/tickets/request")
            .then()
            .statusCode(201)
            .extract()
            .as(TicketSubmissionResponse.class);

    Assertions.assertNotNull(pbsResponse);
    Long pbsTicketId = pbsResponse.getTicketId();

    // Verify PBS ticket has the PBSRequest label
    TicketDtoExtended pbsTicket = ticketService.findTicket(pbsTicketId);
    Assertions.assertTrue(
        pbsTicket.getLabels().stream().anyMatch(label -> label.getName().equals("PBSRequest")));

    // Create second request with same title but different external requestor (TGA) and label
    TicketMetadata tgaRequest =
        TicketMetadata.builder()
            .name(uniqueTitle)
            .description("TGA description")
            .externalRequestors(List.of("TGA"))
            .labels(List.of("TGARequest"))
            .build();

    TicketSubmissionResponse tgaResponse =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(tgaRequest)
            .post(this.getSnomioLocation() + "/api/tickets/request")
            .then()
            .statusCode(201)
            .extract()
            .as(TicketSubmissionResponse.class);

    Assertions.assertNotNull(tgaResponse);
    Long tgaTicketId = tgaResponse.getTicketId();

    // Should create a different ticket since external requestor is different
    Assertions.assertNotEquals(pbsTicketId, tgaTicketId);

    // Verify TGA ticket has the TGARequest label
    TicketDtoExtended tgaTicket = ticketService.findTicket(tgaTicketId);
    Assertions.assertTrue(
        tgaTicket.getLabels().stream().anyMatch(label -> label.getName().equals("TGARequest")));
  }

  private void ensureExternalRequestorExists(String name, String description, String displayColor) {
    Optional<ExternalRequestor> existing = externalRequestorRepository.findByName(name);
    if (!existing.isPresent()) {
      ExternalRequestor externalRequestor =
          ExternalRequestor.builder()
              .name(name)
              .description(description)
              .displayColor(displayColor)
              .build();
      withAuth()
          .contentType(ContentType.JSON)
          .when()
          .body(externalRequestor)
          .post(this.getSnomioLocation() + "/api/tickets/externalRequestors")
          .then()
          .statusCode(200);
    }
  }

  private void ensureLabelExists(String name, String description) {
    Optional<Label> existing = labelRepository.findByName(name);
    if (!existing.isPresent()) {
      Label label = Label.builder().name(name).description(description).build();
      withAuth()
          .contentType(ContentType.JSON)
          .when()
          .body(label)
          .post(this.getSnomioLocation() + "/api/tickets/labelType")
          .then()
          .statusCode(200);
    }
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

  private TicketDto createTicket(String title, String description, String jsonField) {
    TicketDto ticketDto = TicketDto.builder().title(title).description(description).build();
    JsonFieldDto jsonFieldDto = JsonFieldDto.builder().name(jsonField).build();
    Set<JsonFieldDto> startJsonFields = new HashSet<>();
    startJsonFields.add(jsonFieldDto);
    ticketDto.setJsonFields(startJsonFields);
    return withAuth()
        .contentType(ContentType.JSON)
        .when()
        .body(ticketDto)
        .post(this.getSnomioLocation() + "/api/tickets")
        .then()
        .statusCode(200)
        .extract()
        .as(TicketDto.class);
  }
}
