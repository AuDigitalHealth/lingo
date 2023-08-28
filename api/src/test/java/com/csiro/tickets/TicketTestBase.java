package com.csiro.tickets;

import static io.restassured.RestAssured.given;

import com.csiro.snomio.Configuration;
import com.google.gson.JsonObject;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.http.Cookie;
import io.restassured.http.Cookies;
import io.restassured.specification.RequestSpecification;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;

/*
 For now there is some duplicated logic between here and SnomioTestBase. Some kind of attempt
 to make them independant of each other
*/
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT, classes = Configuration.class)
public class TicketTestBase {

  @LocalServerPort int randomServerPort;

  String snomioLocation;
  Cookie imsCookie;

  @PostConstruct
  private void setup() throws IOException {
    snomioLocation = "http://localhost:" + randomServerPort;
    JsonObject usernameAndPassword = new JsonObject();
    usernameAndPassword.addProperty("login", "cgillespie");
    usernameAndPassword.addProperty("password", "cCxG0DxZ12!!!!");

    Cookies cookies =
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

    Cookie imsCookie = cookies.get("uat-ims-ihtsdo");
    this.imsCookie = imsCookie;
  }

  public RequestSpecification withAuth() {
    return given().cookie(imsCookie);
  }

  public int getRandomServerPort() {
    return randomServerPort;
  }

  public String getSnomioLocation() {
    return snomioLocation;
  }

  public Cookie getImsCookie() {
    return imsCookie;
  }
}
