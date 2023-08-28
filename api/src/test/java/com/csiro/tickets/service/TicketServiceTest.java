package com.csiro.tickets.service;

import com.csiro.tickets.TicketTestBase;
import com.csiro.tickets.controllers.dto.TicketDto;
import com.csiro.tickets.repository.TicketRepository;
import io.restassured.http.ContentType;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

public class TicketServiceTest extends TicketTestBase {

  @Autowired TicketRepository ticketRepository;

  @Test
  public void testCreateTicket() {

    TicketDto ticket =
        TicketDto.builder()
            .createdBy("cgillespie")
            .title("A test ticket")
            .description("This is a test description")
            .created(Instant.now())
            .build();

    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .body(ticket)
        .post(this.getSnomioLocation() + "/api/ticket")
        .then()
        .statusCode(200);
  }

  @Test
  public void testFakeLogin() {
    withAuth().get(this.getSnomioLocation() + "/api/auth").then().statusCode(200);
  }
}
