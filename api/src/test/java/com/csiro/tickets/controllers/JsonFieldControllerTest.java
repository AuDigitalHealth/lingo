package com.csiro.tickets.controllers;

import com.csiro.tickets.JsonFieldDto;
import com.csiro.tickets.TicketMinimalDto;
import com.csiro.tickets.TicketTestBaseLocal;
import com.csiro.tickets.models.JsonField;
import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.repository.TicketRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.restassured.http.ContentType;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

public class JsonFieldControllerTest extends TicketTestBaseLocal {

  @Autowired TicketRepository ticketRepository;

  private static final String TEST_TICKET_TITLE = "Test Ticket JsonFieldControllerTest";

  private Long ticketId = null;

  @BeforeEach
  void createTicket() {
    Ticket ticket = createAndCleanTestTicket(TEST_TICKET_TITLE);
    ticketId = ticket.getId();
  }

  @Test
  void createJsonField() {

    JsonFieldDto jsonFieldDto =
        JsonFieldDto.builder().name("Tga Entry").value(createTestJsonNode(null)).build();

    JsonFieldDto jsonFieldDtocreated = addJsonFieldToTicket(jsonFieldDto, ticketId);

    Ticket ticket =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(jsonFieldDto)
            .get(this.getSnomioLocation() + "/api/tickets/" + ticketId)
            .then()
            .statusCode(200)
            .extract()
            .as(Ticket.class);

    List<JsonField> ticketFields = ticket.getJsonFields();

    Assertions.assertEquals(1, ticketFields.size());
    Assertions.assertEquals("Tga Entry", ticketFields.get(0).getName());
  }

  @Test
  void updateJsonField() {

    JsonFieldDto jsonFieldDto =
        JsonFieldDto.builder().name("Tga Entry").value(createTestJsonNode(null)).build();

    JsonFieldDto field = addJsonFieldToTicket(jsonFieldDto, ticketId);

    field.setValue(createTestJsonNode("- updated"));

    JsonFieldDto updatedField =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(field)
            .put(this.getSnomioLocation() + "/api/tickets/json-fields/" + field.getId())
            .then()
            .statusCode(200)
            .extract()
            .as(JsonFieldDto.class);

    JsonNode jsonNode = updatedField.getValue();
    JsonNode fieldValue = jsonNode.get("field1");
    Assertions.assertEquals("\"value1 - updated\"", fieldValue.toString());
  }

  private JsonFieldDto addJsonFieldToTicket(JsonFieldDto jsonFieldDto, Long ticketId) {
    return withAuth()
        .contentType(ContentType.JSON)
        .when()
        .body(jsonFieldDto)
        .post(this.getSnomioLocation() + "/api/tickets/json-fields/" + ticketId)
        .then()
        .statusCode(201)
        .extract()
        .as(JsonFieldDto.class);
  }

  private Ticket createAndCleanTestTicket(String title) {
    Optional<Ticket> foundTicketOptional = ticketRepository.findByTitle(title);

    if (foundTicketOptional.isPresent()) {
      Ticket foundTicket = foundTicketOptional.get();
      if (foundTicket.getJsonFields().size() != 0) {
        foundTicket.setJsonFields(new ArrayList<>());
        Ticket savedTicket = ticketRepository.save(foundTicket);
        return savedTicket;
      }
      return foundTicket;
    }
    TicketMinimalDto ticketMinimalDto =
        TicketMinimalDto.builder().title(title).description("Test Description").build();
    return withAuth()
        .contentType(ContentType.JSON)
        .when()
        .body(ticketMinimalDto)
        .post(this.getSnomioLocation() + "/api/tickets")
        .then()
        .statusCode(200)
        .extract()
        .as(Ticket.class);
  }

  private JsonNode createTestJsonNode(String attendum) {
    ObjectMapper mapper = new ObjectMapper();
    ObjectNode jsonNode = mapper.createObjectNode();

    // Add test JSON data
    jsonNode.put("name", "Tga Entry");
    // Add other fields as needed
    // For example:
    jsonNode.put("field1", attendum != null ? "value1 " + attendum : "value1");
    jsonNode.put("field2", 123);
    jsonNode.put("field3", true);

    return jsonNode;
  }
}
