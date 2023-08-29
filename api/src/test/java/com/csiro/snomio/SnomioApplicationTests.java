package com.csiro.snomio;

import static io.restassured.RestAssured.given;

import io.restassured.RestAssured;
import org.junit.jupiter.api.Test;

class SnomioApplicationTests extends SnomioTestBase {

  @Test
  void contextLoads() {}

  @Test
  void configRespondsNoAuth() {
    given().get(getSnomioLocation()+ "/config").then().statusCode(200);
  }

  @Test
  void authFailsNoAuth() {
    given().get(getSnomioLocation() + "/api/auth").then().statusCode(403);
  }
}
