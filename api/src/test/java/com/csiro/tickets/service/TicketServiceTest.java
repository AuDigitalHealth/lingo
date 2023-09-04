package com.csiro.tickets.service;

import com.csiro.tickets.TicketTestBase;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.repository.TicketRepository;
import com.csiro.tickets.repository.TicketTypeRepository;
import io.restassured.http.ContentType;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class TicketServiceTest extends TicketTestBase {

  @Autowired TicketRepository ticketRepository;

  @Autowired TicketTypeRepository ticketTypeRepository;

  @Test
  void testCreateTicket() {

    TicketDto ticket =
        TicketDto.builder()
            .createdBy("cgillespie")
            .title("A test ticket")
            .description("This is a test description")
            .labels(null)
            .state(null)
            .ticketType(null)
            .created(Instant.now())
            .build();

    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .body(ticket)
        .post(this.getSnomioLocation() + "/api/tickets")
        .then()
        .statusCode(200);
  }
  @Test
  void testCreateTicketNoAuth() {

    TicketDto ticket =
            TicketDto.builder()
                    .createdBy("cgillespie")
                    .title("A test ticket")
                    .description("This is a test description")
                    .labels(null)
                    .state(null)
                    .ticketType(null)
                    .created(Instant.now())
                    .build();

    withBadAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(ticket)
            .post(this.getSnomioLocation() + "/api/tickets")
            .then().log().body()
            .statusCode(403);
  }

  @Test
  void testGetUnknownTicket() {
    withAuth()
            .contentType(ContentType.JSON)
            .when()
            .get(this.getSnomioLocation() + "/api/tickets/999999999")
            .then().log().body()
            .statusCode(404);
  }
}
