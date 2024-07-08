package com.csiro.snomio.controllers;

import com.csiro.snomio.models.ServiceStatus;
import com.csiro.snomio.models.ServiceStatus.Status;
import com.csiro.snomio.service.SnowstormClient;
import com.csiro.snomio.service.TaskManagerClient;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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

  StatusController(TaskManagerClient taskManagerClient, SnowstormClient snowstormClient) {
    this.taskManagerClient = taskManagerClient;
    this.snowstormClient = snowstormClient;
  }

  @GetMapping(value = "")
  public ServiceStatus status(HttpServletRequest request, HttpServletResponse response) {
    Status apStatus = taskManagerClient.getStatus();
    Status snowstormStatus = snowstormClient.getStatus();

    return ServiceStatus.builder().authoringPlatform(apStatus).snowstorm(snowstormStatus).build();
  }
}
