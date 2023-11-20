package com.csiro.snomio.controllers;

import com.csiro.snomio.SnomioTestBase;
import com.csiro.snomio.models.product.ProductSummary;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

class ProductControllerTest extends SnomioTestBase {

  @Test
  void getSimpleProductModel() {
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(
            this.getSnomioLocation()
                + "/api/MAIN/SNOMEDCT-AU/AUAMT/product-model/60912011000036106")
        .then()
        .log()
        .all()
        .statusCode(200)
        .extract()
        .as(ProductSummary.class);
  }

  @Test
  void getComplexProductModel() {
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(
            this.getSnomioLocation()
                + "/api/MAIN/SNOMEDCT-AU/AUAMT/product-model/21062011000036103")
        .then()
        .log()
        .all()
        .statusCode(200)
        .extract()
        .as(ProductSummary.class);
  }

  @Test
  @Disabled("Failing because of Snowstorm ECL defect, should reenable once that is resolved")
  void getProductModelExposingSnowstormEclDefect() {
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(this.getSnomioLocation() + "/api/MAIN/SNOMEDCT-AU/AUAMT/product-model/117891000036107")
        .then()
        .log()
        .all()
        .statusCode(200)
        .extract()
        .as(ProductSummary.class);
  }
}
