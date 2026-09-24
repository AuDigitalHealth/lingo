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

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.ZoneId;
import org.junit.jupiter.api.Test;

/**
 * Date-typed additional field values are stored as instants, whatever form they arrive in.
 *
 * <p>Ticket creation has always converted them, but the path that applies composed content stored
 * what the caller sent. A caller composes dates for people to read — {@code 15/11/2024} — so the
 * same field type ended up holding two different formats depending on whether a ticket was created
 * or updated, and the interface rendered the unconverted ones as "Invalid date".
 *
 * <p>These pin the conversion the storage path relies on, including that it is safe to apply to a
 * value that is already stored correctly.
 */
class AdditionalFieldDateStorageTest {

  private static final ZoneId BUSINESS_ZONE = ZoneId.of("Australia/Sydney");

  private String stored(String source) {
    return InstantUtils.formatTimeToDb(
        source, InstantUtils.YYYY_MM_DD_T_HH_MM_SS_SSSXXX, BUSINESS_ZONE);
  }

  @Test
  void aComposedDateIsStoredAsAnInstant() {
    // dd/MM/yyyy is what the register-derived fields carry — ARTG start date, effective date.
    assertEquals("2024-11-15T00:00:00.000+11:00", stored("15/11/2024"));
  }

  @Test
  void aDateOutsideDaylightSavingKeepsItsOwnOffset() {
    // The offset is the business zone's on that date, not a fixed one.
    assertEquals("2024-07-31T00:00:00.000+10:00", stored("31/07/2024"));
  }

  @Test
  void convertingAValueThatIsAlreadyStoredLeavesItUnchanged() {
    // The update path applies this to whatever it is given, including a value a previous run
    // already converted. If that were not idempotent, every run would rewrite the same field.
    String alreadyStored = "2019-07-31T00:00:00.000+10:00";

    assertEquals(alreadyStored, stored(alreadyStored));
  }

  @Test
  void aTwoDigitYearIsStillAccepted() {
    assertEquals("2024-11-15T00:00:00.000+11:00", stored("15/11/24"));
  }
}
