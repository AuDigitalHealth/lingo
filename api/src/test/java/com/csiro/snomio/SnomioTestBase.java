package com.csiro.snomio;

import io.restassured.http.Cookie;
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

  String snomioLocation;
  Cookie imsCookie;

  @PostConstruct
  private void setupPort() throws IOException {
    snomioLocation = "http://localhost:" + randomServerPort;
  }
  ;

  protected void beforeTests() throws IOException {}
  ;

  public String getSnomioLocation() {
    return snomioLocation;
  }

  public int getRandomServerPort() {
    return randomServerPort;
  }
}
