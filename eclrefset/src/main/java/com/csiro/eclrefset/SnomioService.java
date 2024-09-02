package com.csiro.eclrefset;

import com.csiro.tickets.JobResultDto;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.http.Cookie;
import io.restassured.parsing.Parser;
import io.restassured.response.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SnomioService {

  @Value("${snomio-location}")
  String snomioLocation;

  public int postJobResult(JobResultDto jobResultDto, Cookie cookie) {

    RestAssured.defaultParser = Parser.JSON;

    Response response =
        RestAssured.given()
            .contentType(ContentType.JSON)
            .cookie(cookie.getName(), cookie.getValue())
            .body(jobResultDto)
            .when()
            .post(snomioLocation + "/api/tickets/jobResults")
            .then()
            .statusCode(201)
            .extract()
            .response();

    return response.statusCode();
  }
}
