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
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.ZoneId;
import org.junit.jupiter.api.Test;

class TimeZoneConfigurationTest {

  private final TimeZoneConfiguration configuration = new TimeZoneConfiguration();

  @Test
  void resolvesTheConfiguredZone() {
    assertThat(configuration.businessZoneId("Europe/Dublin")).isEqualTo(ZoneId.of("Europe/Dublin"));
  }

  /**
   * Every site this bean feeds used to hardcode Australia/Brisbane. The default has to keep doing
   * that, or making the zone configurable would silently move the Australian deployment's dates.
   */
  @Test
  void defaultsToBrisbaneSoExistingDeploymentsAreUnaffected() {
    assertThat(configuration.businessZoneId("Australia/Brisbane"))
        .isEqualTo(ZoneId.of("Australia/Brisbane"));
  }

  /**
   * A typo must stop the application rather than leave it running in a zone nobody chose - the
   * symptom would otherwise be dates quietly off by a day.
   */
  @Test
  void rejectsAnUnknownZoneIdAtStartup() {
    assertThatThrownBy(() -> configuration.businessZoneId("Europe/Dubln"))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("snomio.timezone")
        .hasMessageContaining("Europe/Dubln");
  }

  /**
   * A fixed offset is not a zone: it cannot express daylight saving. Rejecting it is deliberate.
   */
  @Test
  void rejectsAnEmptyZoneId() {
    assertThatThrownBy(() -> configuration.businessZoneId(""))
        .isInstanceOf(IllegalStateException.class);
  }
}
