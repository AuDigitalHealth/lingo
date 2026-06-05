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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class StrengthFormatTest {

  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  void serialisesAsLowercaseString() throws Exception {
    assertEquals("\"inference\"", mapper.writeValueAsString(StrengthFormat.INFERENCE));
    assertEquals("\"simple\"", mapper.writeValueAsString(StrengthFormat.SIMPLE));
    assertEquals("\"ratio\"", mapper.writeValueAsString(StrengthFormat.RATIO));
    assertEquals("\"percentage\"", mapper.writeValueAsString(StrengthFormat.PERCENTAGE));
  }

  @Test
  void deserialisesFromLowercaseString() throws Exception {
    assertEquals(StrengthFormat.INFERENCE, mapper.readValue("\"inference\"", StrengthFormat.class));
    assertEquals(StrengthFormat.SIMPLE, mapper.readValue("\"simple\"", StrengthFormat.class));
    assertEquals(StrengthFormat.RATIO, mapper.readValue("\"ratio\"", StrengthFormat.class));
    assertEquals(
        StrengthFormat.PERCENTAGE, mapper.readValue("\"percentage\"", StrengthFormat.class));
  }

  @Test
  void fromStringNullReturnsNull() {
    assertNull(StrengthFormat.fromString(null));
  }

  @Test
  void fromStringUnknownValueThrowsWithListOfValidValues() {
    IllegalArgumentException ex =
        assertThrows(IllegalArgumentException.class, () -> StrengthFormat.fromString("nonsense"));
    // Message must name the bad value and list the valid set so callers can fix their input.
    assertTrue(ex.getMessage().contains("nonsense"), ex.getMessage());
    assertTrue(ex.getMessage().contains("inference"), ex.getMessage());
    assertTrue(ex.getMessage().contains("simple"), ex.getMessage());
    assertTrue(ex.getMessage().contains("ratio"), ex.getMessage());
    assertTrue(ex.getMessage().contains("percentage"), ex.getMessage());
  }
}
