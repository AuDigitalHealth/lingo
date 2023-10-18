package com.csiro.snomio.controllerTests;

import com.csiro.snomio.SnomioTestBase;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.http.ProblemDetail;

class DeviceControllerTest extends SnomioTestBase {

  @Test
  void getWrongPackageDetail() {
    ProblemDetail problemDetail =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .get(this.getSnomioLocation() + "/api/MAIN/SNOMEDCT-AU/AUAMT/devices/21062011000036103")
            .then()
            .log()
            .all()
            .statusCode(404)
            .extract()
            .as(ProblemDetail.class);

    Assertions.assertEquals("Resource Not Found", problemDetail.getTitle());
    Assertions.assertEquals(
        "No matching concepts for 21062011000036103 of type device", problemDetail.getDetail());
  }

  @Test
  void getSimplePackageDetail() {
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(this.getSnomioLocation() + "/api/MAIN/SNOMEDCT-AU/AUAMT/devices/688631000168101")
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
                + "/api/MAIN/SNOMEDCT-AU/AUAMT/devices/product/48646011000036109")
        .then()
        .log()
        .all()
        .statusCode(200);
  }
}
