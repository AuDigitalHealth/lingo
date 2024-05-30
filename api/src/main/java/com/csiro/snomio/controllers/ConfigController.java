package com.csiro.snomio.controllers;

import com.csiro.snomio.configuration.FhirConfiguration;
import com.csiro.snomio.configuration.IhtsdoConfiguration;
import com.csiro.snomio.configuration.UserInterfaceConfiguration;
import com.csiro.snomio.configuration.UserInterfaceConfiguration.UserInterfaceConfigurationBuilder;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    value = "/config",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class ConfigController {

  private final IhtsdoConfiguration ihtsdoConfiguration;

  private final FhirConfiguration fhirConfiguration;

  @Autowired
  public ConfigController(
      IhtsdoConfiguration ihtsdoConfiguration, FhirConfiguration fhirConfiguration) {
    this.ihtsdoConfiguration = ihtsdoConfiguration;
    this.fhirConfiguration = fhirConfiguration;
  }

  @GetMapping(value = "")
  @ResponseBody
  public UserInterfaceConfiguration config(HttpServletRequest request) {
    UserInterfaceConfigurationBuilder builder =
        UserInterfaceConfiguration.builder()
            .imsUrl(ihtsdoConfiguration.getImsApiUrl())
            .apUrl(ihtsdoConfiguration.getApApiUrl())
            .apProjectKey(ihtsdoConfiguration.getApProjectKey())
            .apDefaultBranch(ihtsdoConfiguration.getApDefaultBranch())
            .apLanguageHeader(ihtsdoConfiguration.getApLanguageHeader())
            .apApiBaseUrl(ihtsdoConfiguration.getApApiBaseUrl())
            .fhirServerBaseUrl(fhirConfiguration.getFhirServerBaseUrl())
            .fhirServerExtension(fhirConfiguration.getFhirServerExtension());

    return builder.build();
  }
}
