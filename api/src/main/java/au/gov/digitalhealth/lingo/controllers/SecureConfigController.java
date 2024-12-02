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
package au.gov.digitalhealth.lingo.controllers;

import au.gov.digitalhealth.lingo.configuration.SecureConfiguration;
import au.gov.digitalhealth.lingo.configuration.SentryConfiguration;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    value = "/api/config",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class SecureConfigController {

  private final SentryConfiguration sentryConfiguration;

  public SecureConfigController(SentryConfiguration sentryConfiguration) {
    this.sentryConfiguration = sentryConfiguration;
  }

  @GetMapping(value = "")
  public SecureConfiguration getConfig() {
    SecureConfiguration.SecureConfigurationBuilder builder =
        SecureConfiguration.builder()
            .sentryDsn(sentryConfiguration.getSentryDsn())
            .sentryEnabled(sentryConfiguration.getSentryEnabled())
            .sentryEnvironment(sentryConfiguration.getSentryEnvironment())
            .sentryTracesSampleRate(sentryConfiguration.getSentryTracesSampleRate());
    return builder.build();
  }
}
