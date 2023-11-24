package com.csiro.snomio.controllers;

import com.csiro.snomio.SnomioTestBase;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class AuthControllerTest extends SnomioTestBase {

  @Test
  void testLogin() {
    getSnomioTestClient().getRequest("/api/auth", HttpStatus.OK);
  }

  @Test
  void testLoginBadAuth() {
    getSnomioTestClient()
        .withBadAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(this.getSnomioLocation() + "/api/auth")
        .then()
        .statusCode(HttpStatus.FORBIDDEN.value());
  }
}
