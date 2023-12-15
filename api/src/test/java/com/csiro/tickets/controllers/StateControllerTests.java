package com.csiro.tickets.controllers;


import com.csiro.tickets.TicketTestBase;
import com.csiro.tickets.models.State;
import io.restassured.http.ContentType;
import org.junit.Assert;
import org.junit.jupiter.api.Test;

class StateControllerTests extends TicketTestBase {

  @Test
  void testGetAllStates() {

    State[] allStates =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .get(this.getSnomioLocation() + "/api/tickets/state")
            .then()
            .statusCode(200)
            .extract()
            .as(State[].class);

    Assert.assertEquals(6, allStates.length);
  }
}
