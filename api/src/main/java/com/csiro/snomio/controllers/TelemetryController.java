package com.csiro.snomio.controllers;

import com.csiro.snomio.auth.model.ImsUser;
import com.csiro.snomio.exception.TelemetryProblem;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.opentelemetry.instrumentation.annotations.SpanAttribute;
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
    // WebClient.Builder should be configured globally or injected here
    this.webClient = webClientBuilder.build();
  }

  @PostMapping("/api/telemetry")
  public Mono<Void> forwardTelemetry(@RequestBody byte[] telemetryData) {
    if (!telemetryEnabled) {
      return Mono.empty(); // Return empty response if telemetry is disabled
    }

    // Example of Data Enrichment: Adding metadata (this is just a placeholder)
    ImsUser imsUser =
        (ImsUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    String user = Base64.getEncoder().encodeToString(imsUser.getLogin().getBytes());
    String finalData = addExtraInfo(telemetryData, user);

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

  @WithSpan
  private String addExtraInfo(byte[] telemetryData, @SpanAttribute("user") String user) {
    ObjectMapper mapper = new ObjectMapper();
    try {
      JsonNode root = mapper.readTree(telemetryData);
      processNestedJsonArray(root, "resourceSpans", mapper, user);
      return mapper.writeValueAsString(root);
    } catch (IOException e) {
      throw new TelemetryProblem("Failed to process telemetry data: " + e.getMessage());
    }
  }

  private void processNestedJsonArray(
      JsonNode parentNode, String key, ObjectMapper mapper, String user) {
    if (!parentNode.has(key) || !parentNode.path(key).isArray()) {
      throw new TelemetryProblem("Invalid or missing '" + key + "' in telemetry data.");
    }

    // Process each child node in the array
    for (JsonNode childNode : parentNode.path(key)) {
      if (key.equals("spans")) {
        addLoginAttribute(childNode, mapper, user);
      } else {
        processNestedJsonArray(childNode, getNextKey(key), mapper, user);
      }
    }
  }

  private String getNextKey(String currentKey) {
    switch (currentKey) {
      case "resourceSpans":
        return "scopeSpans";
      case "scopeSpans":
        return "spans";
      default:
        return "";
    }
  }

  private void addLoginAttribute(JsonNode span, ObjectMapper mapper, String user) {
    JsonNode attributesNode = span.path("attributes");
    if (!attributesNode.isArray()) {
      throw new TelemetryProblem("Invalid or missing 'attributes' array in span.");
    }

    ArrayNode attributes = (ArrayNode) attributesNode;
    ObjectNode userAttribute = mapper.createObjectNode();
    userAttribute.put("key", "user");
    userAttribute.set("value", mapper.createObjectNode().put("stringValue", user));
    attributes.add(userAttribute);
  }
}
