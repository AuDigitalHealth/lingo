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

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Verifies {@link JacksonSnowstormConceptMiniConfig}'s post-processing deserializer is actually
 * wired into the app's real {@link ObjectMapper} bean (not just present as an orphaned, unused
 * {@code @Bean}) - see {@link ApiWebConfiguration#objectMapper}.
 */
@SpringBootTest(classes = Configuration.class)
@ActiveProfiles("test")
@Isolated
class JacksonSnowstormConceptMiniConfigTest {

  @Autowired private ObjectMapper objectMapper;

  @Test
  void nullDefinitionStatusDefaultsToPrimitiveOnDeserialization() throws Exception {
    String json = "{\"conceptId\":\"123456789\",\"pt\":{\"term\":\"Foo\",\"lang\":\"en\"}}";

    SnowstormConceptMini result = objectMapper.readValue(json, SnowstormConceptMini.class);

    assertThat(result.getDefinitionStatus()).isEqualTo("PRIMITIVE");
  }

  @Test
  void explicitDefinitionStatusIsNotOverwritten() throws Exception {
    String json =
        "{\"conceptId\":\"123456789\",\"definitionStatus\":\"FULLY_DEFINED\",\"pt\":{\"term\":\"Foo\",\"lang\":\"en\"}}";

    SnowstormConceptMini result = objectMapper.readValue(json, SnowstormConceptMini.class);

    assertThat(result.getDefinitionStatus()).isEqualTo("FULLY_DEFINED");
  }
}
