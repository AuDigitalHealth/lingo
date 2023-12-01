package com.csiro.snomio.exception;

import org.springframework.http.HttpStatus;

public class OntologyCreationProblem extends SnomioProblem {
  public OntologyCreationProblem(String conceptId, Exception e) {
    super(
        "ontology-creation-error",
        "Problem creating ontology",
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Failed to create OWL Ontology to calculate axioms for "
            + conceptId
            + " - "
            + e.getMessage());
  }
}
