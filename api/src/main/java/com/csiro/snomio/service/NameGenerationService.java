package com.csiro.snomio.service;

import com.csiro.snomio.models.FsnAndPt;
import com.csiro.snomio.models.NameGeneratorSpec;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class NameGenerationService {

  WebClient client;

  @Autowired
  public NameGenerationService(@Qualifier("nameGeneratorApiClient") WebClient namegenApiClient) {
    this.client = namegenApiClient;
  }

  public FsnAndPt createFsnAndPreferredTerm(NameGeneratorSpec spec) {
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
