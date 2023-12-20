package com.csiro.snomio;

import com.csiro.snomio.configuration.Configuration;
import com.csiro.snomio.product.FsnAndPt;
import com.csiro.snomio.service.NameGenerationClient;
import com.csiro.tickets.DbInitializer;
import com.google.gson.JsonObject;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.http.Cookie;
import io.restassured.http.Cookies;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.java.Log;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

/*
 For now there is some duplicated logic between here and SnomioTestBase. Some kind of attempt
 to make them independant of each other
*/
@Log
@Getter
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT, classes = Configuration.class)
@ActiveProfiles("test")
@ExtendWith(AmtV4SnowstormExtension.class)
public class SnomioTestBase {

  @LocalServerPort int randomServerPort;

  @Getter String snomioLocation;
  @Getter Cookie imsCookie;

  @Value("${ihtsdo.ims.api.cookie.name}")
  String imsCookieName;

  private SnomioTestClient snomioTestClient;

  @Autowired private DbInitializer dbInitializer;

  @MockBean private NameGenerationClient nameGenerationClient;

  @PostConstruct
  private void setupPort() {
    snomioLocation = "http://localhost:" + randomServerPort;
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
            .post("https://uat-ims.ihtsdotools.org/api/authenticate")
            .then()
            .statusCode(200)
            .extract()
            .response()
            .getDetailedCookies();

    this.imsCookie = cookies.get(imsCookieName);
    snomioTestClient = new SnomioTestClient(imsCookie, getSnomioLocation());
  }

  @BeforeEach
  void initDb() {
    dbInitializer.init();
    Mockito.when(nameGenerationClient.generateNames(Mockito.any()))
        .thenReturn(
            FsnAndPt.builder().FSN("Mock fully specified name").PT("Mock preferred term").build());
  }
}
