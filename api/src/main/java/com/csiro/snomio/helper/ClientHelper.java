package com.csiro.snomio.helper;

import com.csiro.snomio.models.ServiceStatus.Status;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

public class ClientHelper {

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
                  } catch (JsonProcessingException ignored) {
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
}
