package com.csiro.snomio.service;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import org.springframework.stereotype.Service;

@Service
public class NameGenerationService {

  public String createFsn(String semanticTag, SnowstormAxiom axiom) {
    return "FSN";
  }

  public String createPreferredTerm(String semanticTag, SnowstormAxiom axiom) {
    return "PT";
  }
}
