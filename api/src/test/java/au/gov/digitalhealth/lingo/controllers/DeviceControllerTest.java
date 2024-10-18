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
package au.gov.digitalhealth.lingo.controllers;

import au.gov.digitalhealth.lingo.AmtTestData;
import au.gov.digitalhealth.lingo.LingoTestBase;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInfo;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

@Slf4j
class DeviceControllerTest extends LingoTestBase {

  @BeforeEach
  void setup(TestInfo testInfo) {
    log.info("Test started: {}", testInfo.getDisplayName());
  }

  @Test
  void getWrongPackageDetail() {
    ProblemDetail problemDetail =
        getLingoTestClient()
            .getRequest(
                "/api/MAIN/SNOMEDCT-AU/AUAMT/devices/" + AmtTestData.NEXIUM_HP7,
                HttpStatus.NOT_FOUND,
                ProblemDetail.class);

    Assertions.assertEquals("Resource Not Found", problemDetail.getTitle());
    Assertions.assertEquals(
        "No matching concepts for " + AmtTestData.NEXIUM_HP7 + " of type device",
        problemDetail.getDetail());
  }

  @Test
  void getSimplePackageDetail() {
    Assertions.assertNotNull(
        getLingoTestClient().getDevicePackDetails(AmtTestData.COMBINE_ROLE_J_AND_J_1_CARTON));
  }

  @Test
  void getSimpleProductDetail() {
    Assertions.assertNotNull(
        getLingoTestClient().getDeviceProductDetails(AmtTestData.COMBINE_ROLL_10_X_10));
  }
}
