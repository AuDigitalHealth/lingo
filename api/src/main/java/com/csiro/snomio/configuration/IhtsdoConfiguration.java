package com.csiro.snomio.configuration;

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
}
