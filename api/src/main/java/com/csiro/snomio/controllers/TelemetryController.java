package com.csiro.snomio.controllers;

import com.csiro.snomio.auth.model.ImsUser;
import com.csiro.snomio.exception.TelemetryProblem;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import java.io.IOException;
import java.util.Base64;
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
    this.webClient = webClientBuilder.build();
  }

  @PostMapping("/api/telemetry")
  public Mono<Void> forwardTelemetry(@RequestBody byte[] telemetryData) {
    if (!telemetryEnabled) {
      return Mono.empty();
    }

    ImsUser imsUser =
        (ImsUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    String user = Base64.getEncoder().encodeToString(imsUser.getLogin().getBytes());
    String originalData = new String(telemetryData);
    String finalData = addExtraInfo(telemetryData, user);

    return webClient
        .post()
        .uri(otelExporterEndpoint + "/api/v2/spans")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(finalData)
        .retrieve()
        .bodyToMono(Void.class)
        .doOnError(
            e ->
                log.severe(
                    "Failed to forward telemetry data! Original data: ["
                        + originalData
                        + "] ## New Data ["
                        + finalData
                        + "] ### Error: "
                        + e.getMessage()));
  }

  @WithSpan
  private String addExtraInfo(byte[] telemetryData, String user) {
    ObjectMapper mapper = new ObjectMapper();
    try {
      JsonNode root = mapper.readTree(telemetryData);
      if (root.isArray()) {
        for (JsonNode span : root) {
          addLoginAttribute(span, user);
        }
      }
      return mapper.writeValueAsString(root);
    } catch (IOException e) {
      throw new TelemetryProblem("Failed to process telemetry data: " + e.getMessage());
    }
  }

  private void addLoginAttribute(JsonNode span, String user) {
    if (span.isObject()) {
      ObjectNode tags = (ObjectNode) span.path("tags");
      tags.put("user", user);
    }
  }
}
