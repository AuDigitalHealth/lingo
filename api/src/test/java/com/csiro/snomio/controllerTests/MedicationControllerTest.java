package com.csiro.snomio.controllerTests;

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
        .get(this.getSnomioLocation() + "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/1648111000168109")
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
                + "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/product/1648091000168101")
        .then()
        .log()
        .all()
        .statusCode(200);
  }
}
