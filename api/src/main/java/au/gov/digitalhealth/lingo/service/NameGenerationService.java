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

import au.csiro.snowstorm_client.model.SnowstormConceptView;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.FsnAndPt;
import au.gov.digitalhealth.lingo.product.NameGeneratorSpec;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.util.OwlAxiomService;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import java.time.Duration;
import java.time.Instant;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;
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

  OwlAxiomService owlAxiomService;

  @Autowired
  public NameGenerationService(
      NameGenerationClient client,
      OwlAxiomService owlAxiomService,
      @Value("${snomio.nameGenerator.failOnBadInput:false}") boolean failOnBadInput) {
    this.client = client;
    this.owlAxiomService = owlAxiomService;
    this.failOnBadInput = failOnBadInput;
  }

  public void addGeneratedFsnAndPt(
      AtomicCache atomicCache, String semanticTag, Node node, String moduleId) {
    Instant start = Instant.now();
    Optional<NameGeneratorSpec> nameGeneratorSpec =
        generateNameGeneratorSpec(atomicCache, semanticTag, node, moduleId);
    if (nameGeneratorSpec.isEmpty()) return;
    FsnAndPt fsnAndPt = createFsnAndPreferredTerm(nameGeneratorSpec.get());
    node.getNewConceptDetails().setFullySpecifiedName(fsnAndPt.getFSN());
    node.getNewConceptDetails().setPreferredTerm(fsnAndPt.getPT());
    atomicCache.addFsn(node.getConceptId(), fsnAndPt.getFSN());
    if (log.isLoggable(java.util.logging.Level.FINE)) {
      log.fine(
          "Generated FSN and PT for "
              + node.getConceptId()
              + " FSN: "
              + fsnAndPt.getFSN()
              + " PT: "
              + fsnAndPt.getPT()
              + " in "
              + (Duration.between(start, Instant.now()).toMillis())
              + " ms");
    }
  }

  public Optional<NameGeneratorSpec> generateNameGeneratorSpec(
      AtomicCache atomicCache, String semanticTag, Node node, String moduleId) {
    if (node.isNewConcept()) {
      SnowstormConceptView scon = SnowstormDtoUtil.toSnowstormConceptView(node, moduleId);
      Set<String> axioms = owlAxiomService.translate(scon);
      String axiomN;
      try {
        if (axioms == null || axioms.size() != 1) {
          throw new NoSuchElementException();
        }
        axiomN = axioms.stream().findFirst().orElseThrow();
      } catch (NoSuchElementException e) {
        throw new ProductAtomicDataValidationProblem(
            "Could not calculate one (and only one) axiom for concept " + scon.getConceptId());
      }
      axiomN = atomicCache.substituteIdsInAxiom(axiomN, node.getNewConceptDetails().getConceptId());

      return Optional.of(new NameGeneratorSpec(semanticTag, axiomN));
    }

    return Optional.empty();
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
