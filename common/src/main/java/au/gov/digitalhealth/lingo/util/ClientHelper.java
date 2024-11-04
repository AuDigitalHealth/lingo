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
package au.gov.digitalhealth.lingo.util;

import au.gov.digitalhealth.lingo.service.ServiceStatus.Status;
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

  public static final String ITEMS = "items";

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
                    if (jsonNode.has(ITEMS) && jsonNode.get(ITEMS).isArray()) {
                      String latestEffectiveDate = "";
                      for (JsonNode item : jsonNode.get(ITEMS)) {
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
