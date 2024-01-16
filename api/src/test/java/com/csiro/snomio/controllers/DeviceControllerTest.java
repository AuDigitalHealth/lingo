package com.csiro.snomio.controllers;

import static com.csiro.snomio.AmtTestData.COMBINE_ROLE_J_AND_J_1_CARTON;
import static com.csiro.snomio.AmtTestData.COMBINE_ROLL_10_x_10;
import static com.csiro.snomio.AmtTestData.NEXIUM_HP7;

import com.csiro.snomio.SnomioTestBase;
import com.csiro.snomio.product.details.DeviceProductDetails;
import com.csiro.snomio.product.details.PackageDetails;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

class DeviceControllerTest extends SnomioTestBase {

  @Test
  void getWrongPackageDetail() {
    ProblemDetail problemDetail =
        getSnomioTestClient()
            .getRequest(
                "/api/MAIN/SNOMEDCT-AU/AUAMT/devices/" + NEXIUM_HP7,
                HttpStatus.NOT_FOUND,
                ProblemDetail.class);

    Assertions.assertEquals("Resource Not Found", problemDetail.getTitle());
    Assertions.assertEquals(
        "No matching concepts for " + NEXIUM_HP7 + " of type device", problemDetail.getDetail());
  }

  @Test
  void getSimplePackageDetail() {
    PackageDetails<DeviceProductDetails> packageDetails =
        getSnomioTestClient().getDevicePackDetails(COMBINE_ROLE_J_AND_J_1_CARTON);
  }

  @Test
  void getSimpleProductDetail() {
    DeviceProductDetails productDetails =
        getSnomioTestClient().getDeviceProductDetails(COMBINE_ROLL_10_x_10);
  }
}
