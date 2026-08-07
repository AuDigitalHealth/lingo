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
package au.gov.digitalhealth.lingo.configuration;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Reproduces the "Created by X on 22/01/1970" bug reported on the ticket backlog page: a recent
 * java.time.Instant serialized by the app's real ObjectMapper bean was landing in the frontend as a
 * raw epoch-seconds number, which `new Date(value)` (expecting milliseconds) then rendered as a
 * date ~20 days after the 1970 epoch.
 */
@SpringBootTest(classes = Configuration.class)
@ActiveProfiles("test")
@Isolated
class ObjectMapperInstantSerializationTest {

  @Autowired private ObjectMapper objectMapper;

  @Test
  void instantSerializesAsIso8601StringNotEpochSecondsNumber() throws Exception {
    Instant now = Instant.parse("2026-08-07T00:01:34.342808Z");

    String json = objectMapper.writeValueAsString(now);

    assertThat(json).as("Instant JSON: %s", json).startsWith("\"2026-08-07T00:01:34");
  }
}
