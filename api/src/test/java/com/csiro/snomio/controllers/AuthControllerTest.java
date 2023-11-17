package com.csiro.snomio.controllers;

import com.csiro.snomio.SnomioTestBase;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

class AuthControllerTest extends SnomioTestBase {

  @Test
  void testLogin() {
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(this.getSnomioLocation() + "/api/auth")
        .then()
        .statusCode(200);
  }

  @Test
  void testLoginBadAuth() {
    withBadAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(this.getSnomioLocation() + "/api/auth")
        .then()
        .statusCode(403);
  }
}
