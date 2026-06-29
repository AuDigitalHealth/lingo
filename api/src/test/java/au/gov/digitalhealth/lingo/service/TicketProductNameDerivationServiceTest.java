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
package au.gov.digitalhealth.lingo.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Set;
import org.junit.jupiter.api.Test;

class TicketProductNameDerivationServiceTest {

  private final ObjectMapper mapper = new ObjectMapper();

  private JsonNode json(String s) throws Exception {
    return mapper.readTree(s);
  }

  @Test
  void hpraReturnsProductNameVerbatim() throws Exception {
    JsonNode value = json("{\"ProductName\":\"Ongentys 50 mg hard capsules\"}");

    var result = TicketProductNameDerivationService.deriveFrom(Set.of("HPRA"), value);

    assertThat(result).contains("Ongentys 50 mg hard capsules");
  }

  @Test
  void pcrsReturnsProductNameSliceWithPackDescriptionCasing() throws Exception {
    JsonNode value =
        json(
            "{\"ProductName\":[\"FORTISIP COMPACT 125 ML. PACK\"],"
                + "\"PackDescription\":[\"Fortisip Compact 125 ml. Pack 1\"]}");

    var result = TicketProductNameDerivationService.deriveFrom(Set.of("PCRS"), value);

    assertThat(result).contains("Fortisip Compact 125 ml. Pack");
  }

  @Test
  void pcrsReturnsEmptyWhenNoSubstringMatch() throws Exception {
    JsonNode value =
        json(
            "{\"ProductName\":[\"SOMETHING ELSE\"],"
                + "\"PackDescription\":[\"Fortisip Compact 125 ml. Pack 1\"]}");

    var result = TicketProductNameDerivationService.deriveFrom(Set.of("PCRS"), value);

    assertThat(result).isEmpty();
  }

  @Test
  void discriminatesByValueShapeWhenLabelMissing() throws Exception {
    JsonNode hpra = json("{\"ProductName\":\"Plain Name\"}");
    JsonNode pcrs =
        json("{\"ProductName\":[\"PLAIN NAME\"],\"PackDescription\":[\"Plain Name pack\"]}");

    assertThat(TicketProductNameDerivationService.deriveFrom(Set.of(), hpra))
        .contains("Plain Name");
    assertThat(TicketProductNameDerivationService.deriveFrom(Set.of(), pcrs))
        .contains("Plain Name");
  }
}
