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

import au.gov.digitalhealth.tickets.JsonFieldDto;
import au.gov.digitalhealth.tickets.TicketMinimalDto;
import au.gov.digitalhealth.tickets.TicketTestBaseLocal;
import au.gov.digitalhealth.tickets.models.JsonField;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.restassured.http.ContentType;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class JsonFieldControllerTest extends TicketTestBaseLocal {

  private static final String TEST_TICKET_TITLE = "Test Ticket JsonFieldControllerTest";
  @Autowired TicketRepository ticketRepository;
  private Long ticketId = null;

  @BeforeEach
  void createTicket() {
    Ticket ticket = createAndCleanTestTicket(TEST_TICKET_TITLE);
    ticketId = ticket.getId();
  }

  @Test
  void createJsonField() {

    JsonFieldDto jsonFieldDto =
        JsonFieldDto.builder()
            .name(TicketMinimalDto.TGA_ENTRY_FIELD_NAME)
            .value(createTestJsonNode(null))
            .build();

    addJsonFieldToTicket(jsonFieldDto, ticketId);

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

    Set<JsonField> ticketFields = ticket.getJsonFields();

    Assertions.assertEquals(1, ticketFields.size());
    Assertions.assertEquals("Tga Entry", ticketFields.iterator().next().getName());
  }

  @Test
  void updateJsonField() {

    JsonFieldDto jsonFieldDto =
        JsonFieldDto.builder()
            .name(TicketMinimalDto.TGA_ENTRY_FIELD_NAME)
            .value(createTestJsonNode(null))
            .build();

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
      if (!foundTicket.getJsonFields().isEmpty()) {
        foundTicket.setJsonFields(new HashSet<>());
        return ticketRepository.save(foundTicket);
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
    jsonNode.put("name", TicketMinimalDto.TGA_ENTRY_FIELD_NAME);
    // Add other fields as needed
    // For example:
    jsonNode.put("field1", attendum != null ? "value1 " + attendum : "value1");
    jsonNode.put("field2", 123);
    jsonNode.put("field3", true);

    return jsonNode;
  }
}
