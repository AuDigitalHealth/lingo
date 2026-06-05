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
package au.gov.digitalhealth.lingo.product.namegenerator;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.TestFactory;

class StrengthFormatHeuristicTest {

  @TestFactory
  Iterable<DynamicTest> classifiesCuratedCases() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    InputStream stream = getClass().getResourceAsStream("/strength-format/heuristic-cases.json");
    assertThat(stream).as("fixture file present on test classpath").isNotNull();
    JsonNode array = mapper.readTree(stream);

    List<DynamicTest> tests = new ArrayList<>();
    for (JsonNode node : array) {
      String pt = node.get("pt").asText();
      StrengthFormat expected = StrengthFormat.valueOf(node.get("expected").asText());
      boolean concentration = node.get("concentrationStrength").asBoolean();
      String comment = node.path("comment").asText("");
      tests.add(
          DynamicTest.dynamicTest(
              "[" + expected + "] " + pt + " — " + comment,
              () ->
                  assertThat(StrengthFormatHeuristic.classify(pt, concentration))
                      .as("%s (%s)", pt, comment)
                      .isEqualTo(expected)));
    }
    return tests;
  }

  @org.junit.jupiter.api.Test
  void nullPtReturnsInference() {
    assertThat(StrengthFormatHeuristic.classify(null, true)).isEqualTo(StrengthFormat.INFERENCE);
    assertThat(StrengthFormatHeuristic.classify(null, false)).isEqualTo(StrengthFormat.INFERENCE);
  }
}
