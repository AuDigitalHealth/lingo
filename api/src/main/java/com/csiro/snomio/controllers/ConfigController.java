package com.csiro.snomio.controllers;

import com.csiro.snomio.configuration.IhtsdoConfiguration;
import com.csiro.snomio.models.UserInterfaceConfiguration;
import com.csiro.snomio.models.UserInterfaceConfiguration.UserInterfaceConfigurationBuilder;
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

  @Autowired private IhtsdoConfiguration ihtsdoConfiguration;

  @GetMapping(value = "")
  @ResponseBody
  public UserInterfaceConfiguration config(HttpServletRequest request) {
    UserInterfaceConfigurationBuilder builder =
        UserInterfaceConfiguration.builder()
            .imsUrl(ihtsdoConfiguration.getImsApiUrl())
            .apUrl(ihtsdoConfiguration.getApApiUrl())
            .apProjectKey(ihtsdoConfiguration.getApProjectKey());

    return builder.build();
  }
}
