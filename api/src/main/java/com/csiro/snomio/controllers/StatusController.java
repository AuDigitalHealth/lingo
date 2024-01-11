package com.csiro.snomio.controllers;

import com.csiro.snomio.service.MedicationCreationService;
import com.csiro.snomio.service.MedicationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

@RestController
@RequestMapping(
    value = "/api/status",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class StatusController {

  WebClient authoringPlatformApiClient;
  WebClient snowStormApiClient;
  @Autowired
  StatusController(
      @Qualifier("authoringPlatformApiClient") WebClient authoringPlatformApiClient,
      @Qualifier("authoringPlatformApiClient") WebClient snowStormApiClient) {
    this.authoringPlatformApiClient = authoringPlatformApiClient;
    this.snowStormApiClient = snowStormApiClient;
  }
  @GetMapping(value = "")
  public void status(HttpServletRequest request, HttpServletResponse response) {

  }
}
