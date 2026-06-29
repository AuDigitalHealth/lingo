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
package au.gov.digitalhealth.lingo.product;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import au.gov.digitalhealth.lingo.product.namegenerator.StrengthFormat;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.Test;

class NameGeneratorSpecTest {

  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  void serialisesStrengthFormatAsSnakeCase() throws Exception {
    NameGeneratorSpec spec = new NameGeneratorSpec("tag", "owl", "ptOwl", List.of());
    spec.setStrengthFormat(StrengthFormat.SIMPLE);

    String json = mapper.writeValueAsString(spec);

    assertTrue(json.contains("\"strength_format\":\"simple\""), json);
  }

  @Test
  void omitsStrengthFormatWhenNull() throws Exception {
    NameGeneratorSpec spec = new NameGeneratorSpec("tag", "owl", "ptOwl", List.of());

    String json = mapper.writeValueAsString(spec);

    assertFalse(json.contains("strength_format"), json);
  }

  @Test
  void toStringIncludesStrengthFormatWhenSet() {
    NameGeneratorSpec spec = new NameGeneratorSpec("tag", "owl", "ptOwl", List.of());
    spec.setStrengthFormat(StrengthFormat.PERCENTAGE);

    assertTrue(spec.toString().contains("PERCENTAGE"), spec.toString());
  }

  @Test
  void fourArgConstructorLeavesStrengthFormatNull() {
    NameGeneratorSpec spec = new NameGeneratorSpec("tag", "owl", "ptOwl", List.of());

    assertEquals(null, spec.getStrengthFormat());
  }

  @Test
  void serialisesBrandedProductNameAsSnakeCaseWhenPresent() throws Exception {
    NameGeneratorSpec spec =
        new NameGeneratorSpec("branded clinical drug", "owl", "ptOwl", List.of());
    spec.setBrandedProductName("Ongentys 50 mg hard capsules");

    String json = mapper.writeValueAsString(spec);

    assertTrue(json.contains("\"branded_product_name\":\"Ongentys 50 mg hard capsules\""), json);
  }

  @Test
  void omitsBrandedProductNameWhenNull() throws Exception {
    NameGeneratorSpec spec =
        new NameGeneratorSpec("branded clinical drug", "owl", "ptOwl", List.of());

    String json = mapper.writeValueAsString(spec);

    assertFalse(json.contains("branded_product_name"), json);
  }
}
