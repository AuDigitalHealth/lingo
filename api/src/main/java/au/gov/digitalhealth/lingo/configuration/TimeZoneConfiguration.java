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

import java.time.DateTimeException;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Supplies the deployment's business timezone.
 *
 * <p>Snomio turns instants into calendar dates in several places - the date an external requestor
 * made a request, the dates rendered into the backlog CSV export, the day boundaries a due-date
 * search snaps to. A calendar date is only meaningful relative to a zone, and the server's own zone
 * is not the answer: containers run in UTC, so relying on the JVM default would put "today" an
 * afternoon ahead or behind whatever the people using Snomio consider today.
 *
 * <p>The zone therefore has to be stated, and it has to be stated per deployment: Snomio runs
 * against the Australian AMT and the Irish NMPC extension, whose users are ten hours apart. The
 * default preserves the behaviour every one of these sites was hardcoded to before this was
 * configurable, so an existing deployment sees no change; the Irish deployment sets {@code
 * snomio.timezone=Europe/Dublin}.
 *
 * <p>This is deliberately not the JVM default zone. Setting {@code user.timezone} at startup would
 * reach further than the ticketing dates that need it - into logging, JDBC and Jackson - and would
 * make the zone a global that nothing declares a dependency on. Injecting a {@link ZoneId} keeps
 * every conversion explicit about which zone it means.
 */
@Configuration
public class TimeZoneConfiguration {

  /**
   * @param zoneId an IANA zone id, e.g. {@code Australia/Brisbane} or {@code Europe/Dublin}
   * @return the configured business zone
   * @throws IllegalStateException if the configured value is not a known zone id, so a typo fails
   *     at startup rather than silently falling back to a zone nobody chose
   */
  @Bean
  public ZoneId businessZoneId(@Value("${snomio.timezone:Australia/Brisbane}") String zoneId) {
    try {
      return ZoneId.of(zoneId);
    } catch (DateTimeException e) {
      throw new IllegalStateException(
          "snomio.timezone is not a valid IANA zone id: '"
              + zoneId
              + "'. Expected something like Australia/Brisbane or Europe/Dublin.",
          e);
    }
  }
}
