package com.csiro.snomio.service;

import com.csiro.snomio.product.FsnAndPt;
import com.csiro.snomio.product.NameGeneratorSpec;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class NameGenerationClient {

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
        .block();
  }
}
