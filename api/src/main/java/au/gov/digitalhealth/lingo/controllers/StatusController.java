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

import au.gov.digitalhealth.lingo.service.ServiceStatus;
import au.gov.digitalhealth.lingo.service.ServiceStatus.SnowstormStatus;
import au.gov.digitalhealth.lingo.service.ServiceStatus.Status;
import au.gov.digitalhealth.lingo.service.SnowstormClient;
import au.gov.digitalhealth.lingo.service.TaskManagerClient;
import au.gov.digitalhealth.lingo.service.identifier.IdentifierSource;
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
