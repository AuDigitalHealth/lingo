package com.csiro.snomio;

import io.restassured.RestAssured;
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
public class SnomioTestBase {
  @LocalServerPort int randomServerPort;

  @PostConstruct
  private void setupPort() throws IOException {
    RestAssured.port = randomServerPort;
  }

  protected void beforeTests() throws IOException {}
}
