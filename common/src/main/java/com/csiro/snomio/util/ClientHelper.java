package com.csiro.snomio.util;

import com.csiro.snomio.service.ServiceStatus.Status;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import lombok.extern.java.Log;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Log
public class ClientHelper {

  private ClientHelper() {}

  public static Status getStatus(WebClient client, String path) {
    ObjectMapper objectMapper = new ObjectMapper();
    try {
      return client
          .get()
          .uri("/version")
          .retrieve()
          .onStatus(HttpStatus.INTERNAL_SERVER_ERROR::equals, clientResponse -> Mono.empty())
          .bodyToMono(String.class)
          .timeout(Duration.ofSeconds(5))
          .map(
              responseBody -> {
                if (responseBody != null && !responseBody.isEmpty()) {
                  JsonNode jsonNode = null;
                  try {
                    jsonNode = objectMapper.readTree(responseBody);
                  } catch (JsonProcessingException e) {
                    log.fine("Error parsing response body " + e.getMessage());
                  }
                  String version = jsonNode != null ? jsonNode.path(path).asText() : "";

                  return Status.builder().running(true).version(version).build();
                } else {
                  return Status.builder().running(false).version("").build();
                }
              })
          .block();
    } catch (Exception ex) {
      return Status.builder().running(false).version("").build();
    }
  }

  public static String getEffectiveDate(WebClient client, String codeSystem) {
    ObjectMapper objectMapper = new ObjectMapper();
    try {
      return client
          .get()
          .uri(String.format("/codesystems/%s/versions", codeSystem))
          .retrieve()
          .onStatus(HttpStatus.INTERNAL_SERVER_ERROR::equals, clientResponse -> Mono.empty())
          .bodyToMono(String.class)
          .timeout(Duration.ofSeconds(15))
          .map(
              responseBody -> {
                if (responseBody != null && !responseBody.isEmpty()) {
                  try {
                    JsonNode jsonNode = objectMapper.readTree(responseBody);
                    if (jsonNode.has("items") && jsonNode.get("items").isArray()) {
                      String latestEffectiveDate = "";
                      for (JsonNode item : jsonNode.get("items")) {
                        if (item.has("effectiveDate")) {
                          String effectiveDate = item.get("effectiveDate").asText();
                          if (effectiveDate.compareTo(latestEffectiveDate) > 0) {
                            latestEffectiveDate = effectiveDate;
                          }
                        }
                      }
                      return latestEffectiveDate;
                    }
                  } catch (JsonProcessingException e) {
                    log.fine("Error parsing response body " + e.getMessage());
                  }
                }
                return "";
              })
          .block();
    } catch (Exception ex) {
      return "";
    }
  }
}
