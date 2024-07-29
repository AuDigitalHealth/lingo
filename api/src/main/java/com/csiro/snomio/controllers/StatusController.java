package com.csiro.snomio.controllers;

import com.csiro.snomio.models.ServiceStatus;
import com.csiro.snomio.models.ServiceStatus.SnowstormStatus;
import com.csiro.snomio.models.ServiceStatus.Status;
import com.csiro.snomio.service.SnowstormClient;
import com.csiro.snomio.service.TaskManagerClient;
import com.csiro.snomio.service.identifier.IdentifierSource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    value = "/api/status",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class StatusController {

  TaskManagerClient taskManagerClient;
  SnowstormClient snowstormClient;
  IdentifierSource identifierSource;

  @Value("${ihtsdo.ap.codeSystem}")
  String codeSystem;

  StatusController(
      TaskManagerClient taskManagerClient,
      SnowstormClient snowstormClient,
      IdentifierSource identifierSource) {
    this.taskManagerClient = taskManagerClient;
    this.snowstormClient = snowstormClient;
    this.identifierSource = identifierSource;
  }

  @GetMapping(value = "")
  public ServiceStatus status(HttpServletRequest request, HttpServletResponse response) {
    Status apStatus = taskManagerClient.getStatus();
    SnowstormStatus snowstormStatus = snowstormClient.getStatus(codeSystem);
    Status cisStatus = identifierSource.getStatus();

    return ServiceStatus.builder()
        .authoringPlatform(apStatus)
        .snowstorm(snowstormStatus)
        .cis(cisStatus)
        .build();
  }
}
