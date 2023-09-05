package com.csiro.tickets.controllers;

import com.csiro.tickets.TicketTestBase;
import com.csiro.tickets.models.Label;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

public class LabelControllerTests extends TicketTestBase {

  @Test
  public void testCreateLabel() {
    Label label = Label.builder().name("S8").description("This is a duplicate").build();

    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .body(label)
        .post(this.getSnomioLocation() + "/api/tickets/labelType")
        .then()
        .statusCode(409);

    label = Label.builder().name("Passes").description("This isn't a duplicate").build();

    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .body(label)
        .post(this.getSnomioLocation() + "/api/tickets/labelType")
        .then()
        .statusCode(200);
  }

  @Test
  public void addLabelToTicket() {

    // no existing ticket
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .post(this.getSnomioLocation() + "/api/tickets/69420/labels/100")
        .then()
        .statusCode(404);

    // already existing
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .post(this.getSnomioLocation() + "/api/tickets/100/labels/100")
        .then()
        .statusCode(409);
  }
}
