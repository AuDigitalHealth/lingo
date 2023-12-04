package com.csiro.snomio.service;

import com.csiro.snomio.models.FsnAndPt;
import com.csiro.snomio.models.NameGeneratorSpec;
import java.util.logging.Level;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@Log
public class NameGenerationService {

  private final boolean failOnBadInput;
  WebClient client;

  @Autowired
  public NameGenerationService(
      @Qualifier("nameGeneratorApiClient") WebClient namegenApiClient,
      @Value("${snomio.nameGenerator.failOnBadInput:false}") boolean failOnBadInput) {
    this.client = namegenApiClient;
    this.failOnBadInput = failOnBadInput;
  }

  public FsnAndPt createFsnAndPreferredTerm(NameGeneratorSpec spec) {

    if (spec.getOwl().matches(".*\\d{7,18}.*")) {
      String msg =
          "Axiom to generate names for contains SCTID/s - results may be unreliable. Axiom was - "
              + spec.getOwl();
      log.severe(msg);
      if (failOnBadInput) {
        throw new IllegalArgumentException(msg);
      }
    }

    FsnAndPt result =
        this.client
            .post()
            .uri("/amt_name_gen")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(spec)
            .retrieve()
            .bodyToMono(FsnAndPt.class)
            .block();

    if (log.isLoggable(Level.FINE)) {
      log.fine("NameGeneratorSpec: " + spec);
      log.fine("Result: " + result);
    }

    return result;
  }
}
