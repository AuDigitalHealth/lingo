package com.csiro.snomio;

import com.csiro.snomio.configuration.Configuration;
import com.csiro.snomio.product.FsnAndPt;
import com.csiro.snomio.service.NameGenerationClient;
import com.csiro.snomio.service.cis.CISBulkRequestResponse;
import com.csiro.snomio.service.cis.CISGenerateRequest;
import com.csiro.snomio.service.cis.CISRecord;
import com.csiro.tickets.DbInitializer;
import com.google.gson.JsonObject;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.http.Cookie;
import io.restassured.http.Cookies;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.Getter;
import lombok.extern.java.Log;
import okhttp3.mockwebserver.Dispatcher;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.apache.commons.validator.routines.checkdigit.CheckDigitException;
import org.apache.commons.validator.routines.checkdigit.VerhoeffCheckDigit;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper;

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

  private static final String NAMESPACE = "1000168";
  private static final VerhoeffCheckDigit verhoeffCheckDigit = new VerhoeffCheckDigit();
  static int sequence = 10000000;
  static MockWebServer mockWebServer;
  @LocalServerPort int randomServerPort;
  @Getter String snomioLocation;
  @Getter Cookie imsCookie;

  @Value("${ihtsdo.ims.api.cookie.name}")
  String imsCookieName;

  @Value("${ihtsdo.ims.api.url}")
  String imsBaseUrl;

  @Value("${ims-username}")
  String username;

  @Value("${ims-password}")
  String password;

  private SnomioTestClient snomioTestClient;
  @Autowired private DbInitializer dbInitializer;
  @MockBean private NameGenerationClient nameGenerationClient;

  @BeforeAll
  static void beforeAll() throws IOException {
    mockWebServer = new MockWebServer();
    final Dispatcher dispatcher =
        new Dispatcher() {

          public static final String BULK_JOB_REGEXP = "/bulk/jobs/(\\d+)/records.*";
          public static final Pattern BULK_JOB_PATTERN = Pattern.compile(BULK_JOB_REGEXP);

          @Override
          public MockResponse dispatch(RecordedRequest request) {
            try {
              ObjectMapper objectMapper = new ObjectMapper();
              if (request.getPath().equals("/authenticate")) {
                return new MockResponse().setResponseCode(200);
              } else if (request.getPath().equals("/login")) {
                return new MockResponse()
                    .setResponseCode(200)
                    .addHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .setBody(objectMapper.writeValueAsString(Map.of("token", "mock-token")));
              } else if (request.getPath().startsWith("/sct/bulk/reserve")) {
                CISGenerateRequest cisGenerateRequest;

                cisGenerateRequest =
                    objectMapper.readValue(request.getBody().readUtf8(), CISGenerateRequest.class);

                CISBulkRequestResponse cisResponse = new CISBulkRequestResponse();
                cisResponse.setId(Integer.toString(cisGenerateRequest.getQuantity()));

                return new MockResponse()
                    .setResponseCode(200)
                    .addHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .setBody(objectMapper.writeValueAsString(cisResponse));
              }

              Matcher matcher = BULK_JOB_PATTERN.matcher(request.getPath());
              if (matcher.matches()) {
                int requestedCount = Integer.parseInt(matcher.group(1));
                List<CISRecord> records = new ArrayList<>(requestedCount);
                for (int i = 0; i < requestedCount; i++) {
                  records.add(new CISRecord(generateNextSctid()));
                }

                return new MockResponse()
                    .setResponseCode(200)
                    .addHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .setBody(objectMapper.writeValueAsString(records));
              }
              return new MockResponse().setResponseCode(404);
            } catch (IOException e) {
              throw new RuntimeException(e);
            }
          }
        };
    mockWebServer.setDispatcher(dispatcher);
    mockWebServer.start();
  }

  private static synchronized long generateNextSctid() {
    int s = sequence++;
    String partition = "10";
    try {
      return Long.parseLong(
          s + NAMESPACE + partition + verhoeffCheckDigit.calculate(s + NAMESPACE + partition));
    } catch (CheckDigitException e) {
      throw new RuntimeException(e);
    }
  }

  @AfterAll
  static void afterAll() throws IOException {
    mockWebServer.shutdown();
  }

  @DynamicPropertySource
  static void setProperties(DynamicPropertyRegistry registry) {
    registry.add("cis.api.url", () -> "http://localhost:" + mockWebServer.getPort());
  }

  @PostConstruct
  private void setupPort() {
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
