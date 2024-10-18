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

import java.util.List;
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

  @Value("${ihtsdo.ims.api.url}")
  String imsApiUrl;

  @Value("${ihtsdo.ims.api.cookie.name}")
  String imsApiCookieName;

  @Value("${ihtsdo.ims.api.cookie.value}")
  String imsApiCookieValue;

  @Value("${ihtsdo.ap.api.url}")
  String apApiUrl;

  @Value("${ihtsdo.ap.projectkey}")
  String apProjectKey;

  @Value("${ihtsdo.ap.defaultBranch}")
  String apDefaultBranch;

  @Value("${ihtsdo.ap.snodine.defaultBranch}")
  String apSnodineDefaultBranch;

  @Value("${ihtsdo.ap.languageHeader}")
  String apLanguageHeader;

  @Value("${ihtsdo.base.api.url}")
  String apApiBaseUrl;

  @Value("${snomio.snodine.snowstorm.proxy}")
  String snodineSnowstormProxy;

  @Value("${snomio.snodine.extensionModules}")
  List<String> snodineExtensionModules;
}
