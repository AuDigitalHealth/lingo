package com.csiro.snomio.controllers;

import static com.csiro.snomio.AmtTestData.COMBINE_ROLE_J_AND_J_1_CARTON;
import static com.csiro.snomio.AmtTestData.COMBINE_ROLL_10_X_10;
import static com.csiro.snomio.AmtTestData.NEXIUM_HP7;

import com.csiro.snomio.SnomioTestBase;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInfo;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

@Slf4j
class DeviceControllerTest extends SnomioTestBase {

  @BeforeEach
  void setup(TestInfo testInfo) {
    log.info("Test started: {}", testInfo.getDisplayName());
  }

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
    getSnomioTestClient().getDevicePackDetails(COMBINE_ROLE_J_AND_J_1_CARTON);
  }

  @Test
  void getSimpleProductDetail() {
    getSnomioTestClient().getDeviceProductDetails(COMBINE_ROLL_10_X_10);
  }
}
