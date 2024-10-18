/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.tickets;

import static io.restassured.RestAssured.given;

import au.gov.digitalhealth.lingo.RabbitTestBase;
import au.gov.digitalhealth.lingo.configuration.Configuration;
import com.google.gson.JsonObject;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.http.Cookie;
import io.restassured.http.Cookies;
import io.restassured.specification.RequestSpecification;
import lombok.Getter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;

/*
 For now there is some duplicated logic between here and LingoTestBase. Some kind of attempt
 to make them independant of each other
*/
@Getter
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT, classes = Configuration.class)
@TestInstance(Lifecycle.PER_METHOD)
@DirtiesContext(classMode = ClassMode.AFTER_EACH_TEST_METHOD)
@ActiveProfiles("test")
public class TicketTestBase extends RabbitTestBase {

  @LocalServerPort int randomServerPort;

  @Value("${ihtsdo.ims.api.cookie.name}")
  String imsCookieName;

  @Value("${ims-username}")
  String username;

  @Value("${ihtsdo.ims.api.url}")
  String imsBaseUrl;

  @Value("${ims-password}")
  String password;

  @Getter String snomioLocation;
  @Getter Cookie imsCookie;

  @BeforeEach
  void setup() {
    initAuth();
  }

  public void initAuth() {
    snomioLocation = "http://localhost:" + randomServerPort;
    final JsonObject usernameAndPassword = new JsonObject();

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

    this.imsCookie = cookies.get(imsCookieName);
  }

  public RequestSpecification withAuth() {
    return given().cookie(imsCookie);
  }

  public RequestSpecification withBadAuth() {
    return given().cookie("foo");
  }
}
