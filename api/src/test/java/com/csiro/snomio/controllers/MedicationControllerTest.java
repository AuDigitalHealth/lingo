package com.csiro.snomio.controllers;

import com.csiro.snomio.SnomioTestBase;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

class MedicationControllerTest extends SnomioTestBase {

  @Test
  void getComplexPackageDetail() {
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(this.getSnomioLocation() + "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/21062011000036103")
        .then()
        .log()
        .all()
        .statusCode(200);
  }

  @Test
  void getSimplePackgeDetail() {
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(
            this.getSnomioLocation() + "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/700027211000036107")
        .then()
        .log()
        .all()
        .statusCode(200);
  }

  @Test
  void getSimpleProductDetail() {
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(
            this.getSnomioLocation()
                + "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/product/6140011000036103")
        .then()
        .log()
        .all()
        .statusCode(200);
  }
}
