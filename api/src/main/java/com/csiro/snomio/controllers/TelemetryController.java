package com.csiro.snomio.controllers;

import com.csiro.snomio.auth.model.ImsUser;
import com.csiro.snomio.exception.TelemetryProblem;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@RestController
@Log
public class TelemetryController {

  private final WebClient webClient;

  @Value("${snomio.telemetry.endpoint}")
  private String otelExporterEndpoint;

  @Value("${snomio.telemetry.enabled}")
  private boolean telemetryEnabled;

  public TelemetryController(WebClient.Builder webClientBuilder) {
    // WebClient.Builder should be configured globally or injected here
    this.webClient = webClientBuilder.build();
  }

  @PostMapping("/api/telemetry")
  public Mono<Void> forwardTelemetry(@RequestBody byte[] telemetryData) {
    if (!telemetryEnabled) {
      return Mono.empty(); // Return empty response if telemetry is disabled
    }

    // Example of Data Enrichment: Adding metadata (this is just a placeholder)
    String finalData = addExtraInfo(telemetryData);

    return webClient
        .post()
        .uri(otelExporterEndpoint + "/v1/traces") // Append endpoint to base URL
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(finalData)
        .retrieve()
        .bodyToMono(Void.class)
        .doOnError(
            e ->
                log.severe(
                    "Failed to forward telemetry data: "
                        + e.getMessage())); // No need to return any content
  }

  private String addExtraInfo(byte[] telemetryData) {
    ObjectMapper mapper = new ObjectMapper();
    ImsUser imsUser =
        (ImsUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    try {
      JsonNode root = mapper.readTree(telemetryData);

      // Ensure that there is an 'attributes' node, and it is an ObjectNode
      ObjectNode attributesNode = (ObjectNode) root.path("attributes");
      if (attributesNode.isMissingNode()) { // If 'attributes' is missing, create it
        attributesNode = ((ObjectNode) root).putObject("attributes");
      }

      // Add the user login to the attributes node
      attributesNode.put("user", imsUser.getLogin());

      return mapper.writeValueAsString(root);
    } catch (IOException e) {
      throw new TelemetryProblem(e.getMessage());
    }
  }
}
