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
package au.gov.digitalhealth.eclrefset;

import static io.restassured.RestAssured.given;

import au.gov.digitalhealth.tickets.ExternalProcessDto;
import au.gov.digitalhealth.tickets.JobResultDto;
import au.gov.digitalhealth.tickets.JobResultDto.ResultDto;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.http.Cookie;
import io.restassured.parsing.Parser;
import io.restassured.response.Response;
import java.util.Comparator;
import java.util.List;
import org.apache.http.HttpStatus;
import java.util.Comparator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriBuilder;
import reactor.core.publisher.Mono;

@Service
public class LingoService {

  @Value("${snomio-location}")
  String snomioLocation;

  public int postJobResult(JobResultDto jobResultDto, Cookie cookie) {

    RestAssured.defaultParser = Parser.JSON;

    jobResultDto.getResults().sort(Comparator.comparing(
        ResultDto::getName,
        Comparator.nullsLast((a, b) -> {

          if (a == null || a.trim().isEmpty()) return 1;
          if (b == null || b.trim().isEmpty()) return -1;


          String aText = a.contains("|") ? a.split("\\|")[1].trim() : a;
          String bText = b.contains("|") ? b.split("\\|")[1].trim() : b;


          if (aText.isEmpty()) return 1;
          if (bText.isEmpty()) return -1;


          char aFirst = aText.toLowerCase().charAt(0);
          char bFirst = bText.toLowerCase().charAt(0);

          return Character.compare(aFirst, bFirst);
        })
    ));


    Response response =
        given()
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

  public List<ExternalProcessDto> getExternalProcesses(Cookie cookie) {
    RestAssured.defaultParser = Parser.JSON;

    try {
      return given()
          .accept(ContentType.JSON)
          .cookie(cookie.getName(), cookie.getValue())
          .when()
          .get(snomioLocation + "/api/tickets/external-processes")
          .then()
          .statusCode(HttpStatus.SC_OK)
          .extract()
          .body()
          .jsonPath()
          .getList(".", ExternalProcessDto.class);
    } catch (Exception e) {
      throw new RuntimeException("Error occurred while making request to getExternalProcesses", e);
    }
  }
}
