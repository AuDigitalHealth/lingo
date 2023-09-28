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

    Long ticketId =
        withAuth()
            .when()
            .get(this.getSnomioLocation() + "/api/tickets")
            .then()
            .statusCode(200)
            .extract()
            .jsonPath()
            .getLong("_embedded.ticketDtoList[0].id");

    Label newLabel =
        Label.builder().name("ThisisNewLabel").description("This is a description").build();
    // no existing ticket
    withAuth()
        .contentType(ContentType.JSON)
        .body(newLabel)
        .when()
        .post(this.getSnomioLocation() + "/api/tickets/69420/labels")
        .then()
        .statusCode(404);

    // no post body
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .post(this.getSnomioLocation() + "/api/tickets/ " + ticketId + "/labels")
        .then()
        .statusCode(400);

    // create new
    Label addedLabel =
        withAuth()
            .contentType(ContentType.JSON)
            .body(newLabel)
            .when()
            .post(this.getSnomioLocation() + "/api/tickets/ " + ticketId + "/labels")
            .then()
            .statusCode(200)
            .extract()
            .as(Label.class);

    // Delete label from ticket
    addedLabel.setName("This is an updated label");
    String deleteApiCall = "/api/tickets/" + ticketId + "/labels/" + addedLabel.getId();
    withAuth().when().delete(this.getSnomioLocation() + deleteApiCall).then().statusCode(200);
  }
}
