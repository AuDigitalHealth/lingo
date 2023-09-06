package com.csiro.tickets.controllers;

import com.csiro.tickets.TicketTestBase;
import com.csiro.tickets.models.Label;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

class LabelControllerTests extends TicketTestBase {

  @Test
  void testCreateLabel() {
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
  void addLabelToTicket() {

    // no existing ticket
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .post(this.getSnomioLocation() + "/api/tickets/69420/labels/1")
        .then()
        .statusCode(404);

    // label doesn't exist
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .post(this.getSnomioLocation() + "/api/tickets/1/labels/69420")
        .then()
        .statusCode(404);

    // create new
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .post(this.getSnomioLocation() + "/api/tickets/1/labels/1")
        .then()
        .statusCode(200);

    // duplicate
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .post(this.getSnomioLocation() + "/api/tickets/1/labels/1")
        .then()
        .statusCode(409);
  }
}
