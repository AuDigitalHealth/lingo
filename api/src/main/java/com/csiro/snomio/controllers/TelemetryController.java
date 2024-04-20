package com.csiro.snomio.controllers;

import com.csiro.snomio.auth.model.ImsUser;
import com.csiro.snomio.exception.TelemetryProblem;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import java.io.IOException;
import java.util.Base64;
import java.util.List;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.security.core.Authentication;
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
  public Mono<Void> forwardTelemetry(@RequestBody byte[] telemetryData, ServerHttpRequest request) {
    if (!telemetryEnabled) {
      return Mono.empty();
    }

    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    Object principal = authentication.getPrincipal();
    String user;
    if (principal instanceof ImsUser imsUser) {
      user = Base64.getEncoder().encodeToString(imsUser.getLogin().getBytes());
    } else {
      user = principal.toString();
      log.info("Principal is: " + principal.toString());
    }
    String finalData = addExtraInfo(telemetryData, user);

    HttpHeaders headers = new HttpHeaders();
    copyTraceHeaders(request.getHeaders(), headers);

    return webClient
        .post()
        .uri(otelExporterEndpoint + "/api/v2/spans")
        .headers(h -> h.addAll(headers))
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(finalData)
        .retrieve()
        .bodyToMono(Void.class)
        .doOnError(
            e ->
                log.severe(
                    "Failed to forward telemetry data!"
                        + " Tried to send telemetry: ["
                        + finalData
                        + "]"
                        + " Error is: "
                        + e.getMessage()));
  }

  private void copyTraceHeaders(HttpHeaders originalHeaders, HttpHeaders targetHeaders) {
    // B3 Propagation headers
    String[] traceHeaders = {
      "X-B3-TraceId", "X-B3-SpanId", "X-B3-ParentSpanId", "X-B3-Sampled", "X-B3-Flags"
    };

    for (String header : traceHeaders) {
      List<String> values = originalHeaders.get(header);
      if (values != null && !values.isEmpty()) {
        targetHeaders.addAll(header, values);
      }
    }
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
