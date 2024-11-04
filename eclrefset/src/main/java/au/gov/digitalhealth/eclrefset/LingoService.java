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

import au.gov.digitalhealth.tickets.JobResultDto;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.http.Cookie;
import io.restassured.parsing.Parser;
import io.restassured.response.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class LingoService {

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
