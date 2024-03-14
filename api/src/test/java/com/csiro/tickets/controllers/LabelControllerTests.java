package com.csiro.tickets.controllers;

import com.csiro.tickets.TicketTestBaseLocal;
import com.csiro.tickets.models.Label;
import com.csiro.tickets.repository.LabelRepository;
import io.restassured.http.ContentType;
import java.util.List;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class LabelControllerTests extends TicketTestBaseLocal {

  @Autowired LabelRepository labelRepository;

  @Test
  @Order(1)
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
  @Order(2)
  void testUpdateLabel() {

    // Label with Id does not exist
    Label label = Label.builder().name("S7").description("Unknown").id(69L).build();

    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .body(label)
        .put(this.getSnomioLocation() + String.format("/api/tickets/labelType/%s", label.getId()))
        .then()
        .statusCode(404);

    // Label with id exists but name duplicates with another label
    List<Label> existingLabels = labelRepository.findAll();
    Label notS8 =
        existingLabels.stream()
            .filter(
                label1 -> {
                  return !label1.getName().equals("S8");
                })
            .findFirst()
            .orElseThrow();

    label = Label.builder().name("S8").description("Unknown").id(notS8.getId()).build();

    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .body(label)
        .put(this.getSnomioLocation() + String.format("/api/tickets/labelType/%s", label.getId()))
        .then()
        .statusCode(409);

    // Successful update
    label = Label.builder().name("S7").description("Passes").id(2L).build();

    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .body(label)
        .put(this.getSnomioLocation() + String.format("/api/tickets/labelType/%s", label.getId()))
        .then()
        .statusCode(200);
  }

  @Test
  @Order(3)
  void testDeleteLabel() {
    // Label with id not exist
    Label label = Label.builder().name("S7").description("Unknown").id(0L).build();

    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .delete(
            this.getSnomioLocation() + String.format("/api/tickets/labelType/%s", label.getId()))
        .then()
        .statusCode(404);

    // Trying to delete a label which is already associated to a ticket
    List<Label> labels = labelRepository.findAll();

    Long ticketId =
        withAuth()
            .when()
            .get(this.getSnomioLocation() + "/api/tickets")
            .then()
            .statusCode(200)
            .extract()
            .jsonPath()
            .getLong("_embedded.ticketDtoList[0].id");

    withAuth()
        .contentType(ContentType.JSON)
        .body(labels.get(0))
        .when()
        .post(
            this.getSnomioLocation()
                + String.format("/api/tickets/%s/labels/%s", ticketId, labels.get(0).getId()))
        .then()
        .statusCode(200)
        .extract()
        .as(Label.class);

    // Associate to a ticket
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .delete(
            this.getSnomioLocation()
                + String.format("/api/tickets/labelType/%s", labels.get(0).getId()))
        .then()
        .statusCode(409);
  }

  @Test
  @Order(4)
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

    List<Label> labels = labelRepository.findAll();

    // no existing ticket
    withAuth()
        .contentType(ContentType.JSON)
        .body(newLabel)
        .when()
        .post(
            this.getSnomioLocation()
                + String.format("/api/tickets/69420/labels/%s", labels.get(0).getId()))
        .then()
        .statusCode(404);

    // Label with that id doesn't exist
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .post(this.getSnomioLocation() + "/api/tickets/ " + ticketId + "/labels/69420")
        .then()
        .statusCode(404);

    // create new
    Label addedLabel =
        withAuth()
            .contentType(ContentType.JSON)
            .body(newLabel)
            .when()
            .post(
                this.getSnomioLocation()
                    + String.format("/api/tickets/%s/labels/%s", ticketId, labels.get(0).getId()))
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
