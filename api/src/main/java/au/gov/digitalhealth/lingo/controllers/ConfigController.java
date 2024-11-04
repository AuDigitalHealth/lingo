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

import au.gov.digitalhealth.lingo.configuration.FhirConfiguration;
import au.gov.digitalhealth.lingo.configuration.IhtsdoConfiguration;
import au.gov.digitalhealth.lingo.configuration.UserInterfaceConfiguration;
import au.gov.digitalhealth.lingo.configuration.UserInterfaceConfiguration.UserInterfaceConfigurationBuilder;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    value = "/config",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class ConfigController {

  private final IhtsdoConfiguration ihtsdoConfiguration;

  private final FhirConfiguration fhirConfiguration;

  @Value("${snomio.environment}")
  private String appEnvironment;

  public ConfigController(
      IhtsdoConfiguration ihtsdoConfiguration, FhirConfiguration fhirConfiguration) {
    this.ihtsdoConfiguration = ihtsdoConfiguration;
    this.fhirConfiguration = fhirConfiguration;
  }

  @GetMapping(value = "")
  public UserInterfaceConfiguration config(HttpServletRequest request) {
    UserInterfaceConfigurationBuilder builder =
        UserInterfaceConfiguration.builder()
            .imsUrl(ihtsdoConfiguration.getImsApiUrl())
            .apUrl(ihtsdoConfiguration.getApApiUrl())
            .apProjectKey(ihtsdoConfiguration.getApProjectKey())
            .apDefaultBranch(ihtsdoConfiguration.getApDefaultBranch())
            .apSnodineDefaultBranch(ihtsdoConfiguration.getApSnodineDefaultBranch())
            .apLanguageHeader(ihtsdoConfiguration.getApLanguageHeader())
            .apApiBaseUrl(ihtsdoConfiguration.getApApiBaseUrl())
            .fhirServerBaseUrl(fhirConfiguration.getFhirServerBaseUrl())
            .fhirServerExtension(fhirConfiguration.getFhirServerExtension())
            .fhirPreferredForLanguage(fhirConfiguration.getFhirPreferredForLanguage())
            .fhirRequestCount(fhirConfiguration.getFhirRequestCount())
            .snodineSnowstormProxy(ihtsdoConfiguration.getSnodineSnowstormProxy())
            .snodineExtensionModules(ihtsdoConfiguration.getSnodineExtensionModules())
            .appEnvironment(appEnvironment);

    return builder.build();
  }
}
