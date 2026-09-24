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
package au.gov.digitalhealth.tickets.helper;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

/**
 * {@code externalRequestors} accepts both the legacy list-of-names shape and the newer
 * list-of-objects shape that carries {@code dateRequested}. Existing integrations send the former.
 */
class TicketMetadataDeserialisationTest {

  private final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

  @Test
  void submissionDetailsBindsFromTheNameSubmissionGatewaySends() {
    // The two TicketMetadata classes are one wire contract expressed twice, matched only by field
    // name. A name that differs is dropped silently rather than rejected, so the details would
    // simply never arrive and the ticket would carry no record of the submission.
    String json =
        """
        {
          "dedupeKey": "443270",
          "name": "TGA - ARTG ID 443270 Ibuprofen",
          "description": "<div>composed</div>",
          "submissionDetails": "<strong>Submission Details</strong><table><tbody></tbody></table>"
        }
        """;

    TicketMetadata metadata =
        assertDoesNotThrow(() -> mapper.readValue(json, TicketMetadata.class));

    assertEquals(
        "<strong>Submission Details</strong><table><tbody></tbody></table>",
        metadata.getSubmissionDetails());
    // Carried separately: the composed description is still the register's own.
    assertEquals("<div>composed</div>", metadata.getDescription());
  }

  @Test
  void anAutomatedCallerSendsNoSubmissionDetails() {
    String json =
        """
        {"dedupeKey": "443270", "description": "<div>composed</div>"}
        """;

    TicketMetadata metadata =
        assertDoesNotThrow(() -> mapper.readValue(json, TicketMetadata.class));

    assertNull(metadata.getSubmissionDetails());
  }

  @Test
  void legacyStringShapeDeserialises() throws JsonProcessingException {
    String json =
        """
        {
          "dedupeKey": "443270",
          "name": "Create a new ticket",
          "externalRequestors": ["PBS"]
        }
        """;

    TicketMetadata metadata = mapper.readValue(json, TicketMetadata.class);

    assertEquals(
        List.of(new ExternalRequestorRequest("PBS", null)), metadata.getExternalRequestors());
    assertNull(metadata.getExternalRequestors().get(0).dateRequested());
  }

  @Test
  void objectShapeWithDateRequestedDeserialises() throws JsonProcessingException {
    String json =
        """
        {
          "name": "Create a new ticket",
          "externalRequestors": [
            {"name": "PBS", "dateRequested": "2026-08-11"},
            {"name": "TGA"}
          ]
        }
        """;

    TicketMetadata metadata = mapper.readValue(json, TicketMetadata.class);

    assertEquals(
        List.of(
            new ExternalRequestorRequest("PBS", LocalDate.of(2026, 8, 11)),
            new ExternalRequestorRequest("TGA", null)),
        metadata.getExternalRequestors());
  }

  @Test
  void mixedShapesDeserialise() throws JsonProcessingException {
    String json =
        """
        {
          "name": "Create a new ticket",
          "externalRequestors": ["PBS", {"name": "TGA", "dateRequested": "2026-08-11"}]
        }
        """;

    TicketMetadata metadata = mapper.readValue(json, TicketMetadata.class);

    assertEquals(
        List.of(
            new ExternalRequestorRequest("PBS", null),
            new ExternalRequestorRequest("TGA", LocalDate.of(2026, 8, 11))),
        metadata.getExternalRequestors());
  }

  /**
   * Mirrors {@code ApiWebConfiguration.objectMapper}, which disables {@code
   * WRITE_DATES_AS_TIMESTAMPS} — without that, dates serialise as {@code [2026,8,11]}.
   */
  @Test
  void dateRequestedSerialisesAsIsoString() throws JsonProcessingException {
    ObjectMapper appMapper =
        new ObjectMapper()
            .findAndRegisterModules()
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    assertEquals(
        "{\"name\":\"PBS\",\"dateRequested\":\"2026-08-11\"}",
        appMapper.writeValueAsString(
            new ExternalRequestorRequest("PBS", LocalDate.of(2026, 8, 11))));
  }
}
