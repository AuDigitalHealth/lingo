package com.csiro.snomio.controllers;

import com.csiro.snomio.SnomioTestClient;
import com.csiro.snomio.configuration.Configuration;
import com.google.gson.JsonObject;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.http.Cookie;
import io.restassured.http.Cookies;
import java.util.Map;
import lombok.Getter;
import lombok.extern.java.Log;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.test.context.ActiveProfiles;

@Getter
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT, classes = Configuration.class)
@ActiveProfiles("test")
@Log
class FieldBindingConfigurationTest {

  @Value("${ihtsdo.ims.api.cookie.name}")
  String imsCookieName;

  @Value("${ihtsdo.ims.api.url}")
  String imsBaseUrl;

  @LocalServerPort int randomServerPort;

  SnomioTestClient snomioTestClient;

  @BeforeEach
  void beforeAll() {
    final JsonObject usernameAndPassword = new JsonObject();
    String username = System.getProperty("ims-username");
    String password = System.getProperty("ims-password");

    usernameAndPassword.addProperty("login", username);
    usernameAndPassword.addProperty("password", password);
    final Cookies cookies =
        RestAssured.given()
            .contentType(ContentType.JSON)
            .when()
            .body(usernameAndPassword.toString())
            .post(imsBaseUrl + "/api/authenticate")
            .then()
            .statusCode(200)
            .extract()
            .response()
            .getDetailedCookies();

    Cookie imsCookie = cookies.get(imsCookieName);
    snomioTestClient = new SnomioTestClient(imsCookie, "http://localhost:" + randomServerPort);
  }

  @Test
  void getFieldBindings() {
    Map<String, String> map =
        snomioTestClient
            .getRequest("/api/MAIN/SNOMEDCT-AU/AUAMT/medications/field-bindings", HttpStatus.OK)
            .body()
            .as(Map.class);
    Assertions.assertThat(map).containsEntry("package.productName", "<774167006");
  }

  @Test
  void getFieldBindingsMissing() {
    ProblemDetail response =
        snomioTestClient
            .getRequest("/api/FOO/medications/field-bindings", HttpStatus.BAD_REQUEST)
            .response()
            .as(ProblemDetail.class);
    Assertions.assertThat(response.getStatus()).isEqualTo(400);
    Assertions.assertThat(response.getTitle()).isEqualTo("No field bindings configured");
  }
}
