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
package au.gov.digitalhealth.lingo.product.details;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import au.gov.digitalhealth.lingo.product.namegenerator.StrengthFormat;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class MedicationProductDetailsTest {

  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  void serialisesStrengthFormatWhenSet() throws Exception {
    MedicationProductDetails d = new MedicationProductDetails();
    d.setStrengthFormat(StrengthFormat.SIMPLE);

    String json = mapper.writeValueAsString(d);

    assertTrue(json.contains("\"strengthFormat\":\"simple\""), json);
  }

  @Test
  void omitsStrengthFormatWhenNull() throws Exception {
    MedicationProductDetails d = new MedicationProductDetails();

    String json = mapper.writeValueAsString(d);

    assertFalse(json.contains("strengthFormat"), json);
  }

  @Test
  void deserialisesFromAbsentField() throws Exception {
    MedicationProductDetails d =
        mapper.readValue("{\"type\":\"medication\"}", MedicationProductDetails.class);
    assertNull(d.getStrengthFormat());
  }
}
