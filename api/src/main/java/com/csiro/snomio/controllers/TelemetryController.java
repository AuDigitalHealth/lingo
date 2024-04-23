package com.csiro.snomio.controllers;

import com.csiro.snomio.auth.model.ImsUser;
import com.csiro.snomio.exception.TelemetryProblem;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.Base64;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

@RestController
@Log
public class TelemetryController {

  private static final String RESOURCE_SPANS = "resourceSpans";
  WebClient zipkinClient;
  WebClient otlpClient;

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Value("${snomio.telemetry.otelendpoint}")
  private String otelExporterEndpoint;

  @Value("${snomio.telemetry.zipkinendpoint}")
  private String zipkinExporterEndpoint;

  @Value("${snomio.telemetry.enabled}")
  private boolean telemetryEnabled;

  public TelemetryController(
      @Qualifier("otCollectorZipkinClient") WebClient otCollectorZipkinClient,
      @Qualifier("otCollectorOTLPClient") WebClient otCollectorOTLPClient) {
    this.zipkinClient = otCollectorZipkinClient;
    this.otlpClient = otCollectorOTLPClient;
  }

  public boolean isTelemetryEnabled() {
    return telemetryEnabled;
  }

  public void setTelemetryEnabled(boolean telemetryEnabled) {
    this.telemetryEnabled = telemetryEnabled;
  }

  public String getZipkinExporterEndpoint() {
    return zipkinExporterEndpoint;
  }

  public void setZipkinExporterEndpoint(String zipkinExporterEndpoint) {
    this.zipkinExporterEndpoint = zipkinExporterEndpoint;
  }

  public String getOtelExporterEndpoint() {
    return otelExporterEndpoint;
  }

  public void setOtelExporterEndpoint(String otelExporterEndpoint) {
    this.otelExporterEndpoint = otelExporterEndpoint;
  }

  @PostMapping("/api/telemetry")
  public Mono<Void> forwardTelemetry(
      @RequestBody byte[] telemetryData, HttpServletRequest request) {
    if (!isTelemetryEnabled()) {
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

    try {
      // UI Sends Telemetry data in OTEL format randomly although it's set to use Zipkin exporter
      JsonNode root = objectMapper.readTree(telemetryData);
      String endpoint = determineEndpoint(root);
      String finalData = addExtraInfo(root, endpoint, user);
      HttpHeaders headers = new HttpHeaders();
      copyTraceHeaders(request, headers, endpoint);
      return sendTelemetryData(
          finalData,
          endpoint.equals(getOtelExporterEndpoint()) ? this.otlpClient : this.zipkinClient,
          headers);
    } catch (Exception e) {
      return Mono.error(new TelemetryProblem("Failed to process telemetry data" + e.getMessage()));
    }
  }

  private Mono<Void> sendTelemetryData(String finalData, WebClient webClient, HttpHeaders headers) {
    return webClient
        .post()
        .headers(h -> h.addAll(headers))
        .bodyValue(finalData)
        .retrieve()
        .bodyToMono(Void.class)
        .onErrorResume(
            WebClientResponseException.class,
            e -> {
              if (e.getStatusCode().is4xxClientError()) {
                log.severe(
                    "Collector error when forwarding telemetry data. "
                        + "Response Body: ["
                        + e.getResponseBodyAsString()
                        + "] Status ["
                        + e.getStatusCode()
                        + "] Error: "
                        + e.getMessage()
                        + "] Telemetry Data: ["
                        + finalData
                        + "]");
                return Mono.empty();
              }
              return Mono.error(e); // Propagate other errors
            });
  }

  private String determineEndpoint(JsonNode root) {
    return root.has(RESOURCE_SPANS) ? getOtelExporterEndpoint() : getZipkinExporterEndpoint();
  }

  private void copyTraceHeaders(
      HttpServletRequest request, HttpHeaders targetHeaders, String endpoint) {
    String[] otelHeaders = {"traceparent"};
    String[] zipkinHeaders = {
      "X-B3-TraceId", "X-B3-SpanId", "X-B3-ParentSpanId", "X-B3-Sampled", "X-B3-Flags"
    };
    String[] traceHeaders;
    if (endpoint.equals(getOtelExporterEndpoint())) {
      traceHeaders = otelHeaders;
    } else {
      traceHeaders = zipkinHeaders;
    }
    for (String header : traceHeaders) {
      String value = request.getHeader(header);
      if (value != null) {
        targetHeaders.add(header, value);
      }
    }
  }

  @WithSpan
  private String addExtraInfo(JsonNode root, String endpoint, String user) {
    try {
      if (endpoint.equals(getOtelExporterEndpoint())) {
        processNestedJsonArray(root, RESOURCE_SPANS, objectMapper, user);
      } else {
        if (root.isArray()) {
          for (JsonNode span : root) {
            addLoginAttributeZipkin(span, user);
          }
        }
      }
      return objectMapper.writeValueAsString(root);
    } catch (IOException e) {
      throw new TelemetryProblem("Failed to process telemetry data: " + e.getMessage());
    }
  }

  private void processNestedJsonArray(
      JsonNode parentNode, String key, ObjectMapper mapper, String base64Login) {
    if (!parentNode.has(key) || !parentNode.path(key).isArray()) {
      throw new TelemetryProblem("Invalid or missing '" + key + "' in telemetry data.");
    }

    for (JsonNode childNode : parentNode.path(key)) {
      if (key.equals("spans")) {
        addLoginAttributeOTEL(childNode, mapper, base64Login);
      } else {
        String nextKey = getNextKey(key);
        processNestedJsonArray(childNode, nextKey, mapper, base64Login);
      }
    }
  }

  private String getNextKey(String currentKey) {
    switch (currentKey) {
      case RESOURCE_SPANS:
        return "scopeSpans";
      case "scopeSpans":
        return "spans";
      default:
        return ""; // No further nesting expected
    }
  }

  private void addLoginAttributeOTEL(JsonNode span, ObjectMapper mapper, String base64Login) {
    JsonNode attributesNode = span.path("attributes");
    if (!attributesNode.isArray()) {
      throw new TelemetryProblem("Invalid or missing 'attributes' array in span.");
    }

    ArrayNode attributes = (ArrayNode) attributesNode;
    ObjectNode userAttribute = mapper.createObjectNode();
    userAttribute.put("key", "user.name");
    userAttribute.set("value", mapper.createObjectNode().put("stringValue", base64Login));
    attributes.add(userAttribute);
  }

  private void addLoginAttributeZipkin(JsonNode span, String user) {
    if (span.isObject()) {
      ObjectNode tags = (ObjectNode) span.path("tags");
      tags.put("user", user);
    }
  }
}
