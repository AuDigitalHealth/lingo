package com.csiro.snomio.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "fhir")
@Getter
@Setter
@Validated
public class FhirConfiguration {

  @Value("${fhir.server.url}")
  String fhirServerBaseUrl;

  @Value("${fhir.extension}")
  String fhirServerExtension;
}
