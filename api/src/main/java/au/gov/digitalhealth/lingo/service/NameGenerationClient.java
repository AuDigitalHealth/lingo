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
package au.gov.digitalhealth.lingo.service;

import au.gov.digitalhealth.lingo.product.FsnAndPt;
import au.gov.digitalhealth.lingo.product.NameGeneratorSpec;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@Log
public class NameGenerationClient {

  public static final String GENERATED_NAME_UNAVAILABLE = "Generated name unavailable";
  WebClient client;
  ObjectMapper objectMapper;

  @Autowired
  public NameGenerationClient(
      @Qualifier("nameGeneratorApiClient") WebClient namegenApiClient, ObjectMapper objectMapper) {
    this.client = namegenApiClient;
    this.objectMapper = objectMapper;
  }

  @Cacheable(value = "nameGenerator", key = "#spec.toString()")
  public FsnAndPt generateNames(NameGeneratorSpec spec) {
    return this.client
        .post()
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(spec)
        .retrieve()
        .bodyToMono(FsnAndPt.class)
        .doOnError(
            e -> {
              try {
                log.severe(
                    "Name generator failed to execute with "
                        + e.getMessage()
                        + " for spec: "
                        + objectMapper.writeValueAsString(spec));
              } catch (JsonProcessingException ex) {
                log.severe(
                    "failed writing log message for name generator Json processing error "
                        + ex.getMessage());
              }
            })
        .onErrorReturn(
            FsnAndPt.builder()
                .FSN(GENERATED_NAME_UNAVAILABLE)
                .PT(GENERATED_NAME_UNAVAILABLE)
                .build())
        .block();
  }
}
