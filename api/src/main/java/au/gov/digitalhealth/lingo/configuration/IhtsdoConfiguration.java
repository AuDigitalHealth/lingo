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

import jakarta.annotation.PostConstruct;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "ihtsdo")
@Getter
@Setter
@Validated
public class IhtsdoConfiguration {

  @NotBlank(message = "IMS API URL is required")
  @Value("${ihtsdo.ims.api.url}")
  String imsApiUrl;

  @NotBlank(message = "IMS API Cookie Name is required")
  @Value("${ihtsdo.ims.api.cookie.name}")
  String imsApiCookieName;

  @Value("${ihtsdo.ims.api.cookie.value}")
  String imsApiCookieValue;

  @NotBlank(message = "AP API URL is required")
  @Value("${ihtsdo.ap.api.url}")
  String apApiUrl;

  @NotEmpty(message = "AP project keys are required")
  @Value("${ihtsdo.ap.projectkey}")
  Set<String> apProjectKeys;

  @NotBlank(message = "AP default branch is required")
  @Value("${ihtsdo.ap.defaultBranch}")
  String apDefaultBranch;

  @NotBlank(message = "AP Snodine default branch is required")
  @Value("${ihtsdo.ap.snodine.defaultBranch}")
  String apSnodineDefaultBranch;

  @NotBlank(message = "AP language header is required")
  @Value("${ihtsdo.ap.languageHeader}")
  String apLanguageHeader;

  @NotBlank(message = "AP base API URL is required")
  @Value("${ihtsdo.base.api.url}")
  String apApiBaseUrl;

  @NotBlank(message = "AP Snodine base API URL is required")
  @Value("${snomio.snodine.snowstorm.proxy}")
  String snodineSnowstormProxy;

  @NotEmpty(message = "AP Snodine extension modules are required")
  @Value("${snomio.snodine.extensionModules}")
  List<String> snodineExtensionModules;

  @PostConstruct
  public void validateApDefaultBranch() {
    String[] parts = apDefaultBranch.split("/");
    String last = parts[parts.length - 1].trim();

    if (last.isEmpty()) {
      throw new IllegalStateException(
          "ihtsdo.ap.defaultBranch has no trailing project key, must end in /<projectKey>");
    }

    if (!apProjectKeys.contains(last)) {
      throw new IllegalStateException(
          "ihtsdo.ap.defaultBranch must end with one of the configured apProjectKeys; last segment='"
              + last
              + "'");
    }
  }
}
