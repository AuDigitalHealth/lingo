package com.csiro.snomio.service;

import com.csiro.snomio.product.FsnAndPt;
import com.csiro.snomio.product.NameGeneratorSpec;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@Log
public class NameGenerationClient {

  public static final String GENERATED_NAME_UNAVAILABLE = "Generated name unavailable";
  WebClient client;

  @Autowired
  public NameGenerationClient(@Qualifier("nameGeneratorApiClient") WebClient namegenApiClient) {
    this.client = namegenApiClient;
  }

  public FsnAndPt generateNames(NameGeneratorSpec spec) {
    return this.client
        .post()
        .uri("/amt_name_gen")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(spec)
        .retrieve()
        .bodyToMono(FsnAndPt.class)
        .doOnError(e -> log.severe("Name generator failed to execute with " + e.getMessage()))
        .onErrorReturn(
            FsnAndPt.builder()
                .FSN(GENERATED_NAME_UNAVAILABLE)
                .PT(GENERATED_NAME_UNAVAILABLE)
                .build())
        .block();
  }
}
