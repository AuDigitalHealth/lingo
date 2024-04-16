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
    String finalData = addExtraInfo(telemetryData, imsUser.getLogin());

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

      // Navigate safely to the attributes array using path to avoid
      // NullPointerException
      JsonNode attributesNode =
          root.path("resourceSpans")
              .path(0) // Assuming it's always the first ResourceSpan we want to modify
              .path("scopeSpans")
              .path(0) // Assuming the first ScopeSpan as well
              .path("spans")
              .path(0) // Assuming the first Span is where the user attribute needs to be added
              .path("attributes");

      // Check if the attributes array is missing or not an array
      if (attributesNode.isMissingNode() || !attributesNode.isArray()) {
        // Log the error, throw an exception, or handle the case where attributes array
        // is not found
        throw new TelemetryProblem("The expected 'attributes' array is missing or not an array.");
      }

      ArrayNode attributes = (ArrayNode) attributesNode;

      // Create the user attribute node
      ObjectNode userAttribute = mapper.createObjectNode();
      userAttribute.put("key", "user");
      userAttribute.set("value", mapper.createObjectNode().put("stringValue", user));

      // Add the user attribute to the attributes array
      attributes.add(userAttribute);

      return mapper.writeValueAsString(root);
    } catch (IOException e) {
      throw new TelemetryProblem("Failed to process telemetry data: " + e.getMessage());
    } catch (ClassCastException e) {
      throw new TelemetryProblem("Invalid JSON format for telemetry data: " + e.getMessage());
    }
  }
}
