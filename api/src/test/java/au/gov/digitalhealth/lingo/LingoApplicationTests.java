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
package au.gov.digitalhealth.lingo;

import static io.restassured.RestAssured.given;

import org.junit.jupiter.api.Test;

class LingoApplicationTests extends LingoTestBase {

  @Test
  void contextLoads() {
    /* fails if context does not load */
  }

  @Test
  void configRespondsNoAuth() {
    given().get(getSnomioLocation() + "/config").then().statusCode(200);
  }

  @Test
  void authFailsNoAuth() {
    given().get(getSnomioLocation() + "/api/auth").then().statusCode(403);
  }
}
