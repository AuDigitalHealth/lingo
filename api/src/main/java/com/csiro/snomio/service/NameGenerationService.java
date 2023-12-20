package com.csiro.snomio.service;

import com.csiro.snomio.product.FsnAndPt;
import com.csiro.snomio.product.NameGeneratorSpec;
import java.util.logging.Level;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Log
public class NameGenerationService {

  private final boolean failOnBadInput;
  NameGenerationClient client;

  @Autowired
  public NameGenerationService(
      NameGenerationClient client,
      @Value("${snomio.nameGenerator.failOnBadInput:false}") boolean failOnBadInput) {
    this.client = client;
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

    FsnAndPt result = client.generateNames(spec);

    if (log.isLoggable(Level.FINE)) {
      log.fine("NameGeneratorSpec: " + spec);
      log.fine("Result: " + result);
    }

    return result;
  }
}
