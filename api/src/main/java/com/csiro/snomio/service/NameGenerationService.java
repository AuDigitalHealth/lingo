package com.csiro.snomio.service;

import au.csiro.snowstorm_client.model.SnowstormAxiomComponent;
import org.springframework.stereotype.Service;

@Service
public class NameGenerationService {

  public String createFsn(String semanticTag, SnowstormAxiomComponent axiom) {
    return "FSN (" + semanticTag + ")";
  }

  public String createPreferredTerm(String semanticTag, SnowstormAxiomComponent axiom) {
    return "PT";
  }
}
