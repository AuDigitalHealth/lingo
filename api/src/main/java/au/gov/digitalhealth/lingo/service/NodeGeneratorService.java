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

import static au.gov.digitalhealth.lingo.service.ProductSummaryService.CTPP_LABEL;
import static au.gov.digitalhealth.lingo.util.AmtConstants.*;
import static au.gov.digitalhealth.lingo.util.ExternalIdentifierUtils.getExternalIdentifiersFromRefsetMemberViewComponents;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.DEFINED;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.PRIMITIVE;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.exception.SingleConceptExpectedProblem;
import au.gov.digitalhealth.lingo.product.NewConceptDetails;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.util.EclBuilder;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.logging.Level;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Service;

@Service
@Log
@EnableAsync
public class NodeGeneratorService {
  SnowstormClient snowstormClient;
  Models models;

  @Value("${snomio.node.concept.search.limit:50}")
  private int limit;

  @Autowired
  public NodeGeneratorService(SnowstormClient snowstormClient, Models models) {
    this.snowstormClient = snowstormClient;
    this.models = models;
  }

  @Async
  public CompletableFuture<Node> lookUpNode(String branch, Long productId, ModelLevel modelLevel) {
    Node node = new Node();
    node.setLabel(modelLevel.getDisplayLabel());
    node.setModelLevel(modelLevel.getModelLevelType());
    node.setDisplayName(modelLevel.getName());
    SnowstormConceptMini concept;
    if (modelLevel.getProductModelEcl() != null && !modelLevel.getProductModelEcl().isBlank()) {
      concept =
          snowstormClient.getConceptFromEcl(branch, modelLevel.getProductModelEcl(), productId);
    } else {
      concept = snowstormClient.getConcept(branch, productId.toString());
    }
    node.setConcept(concept);
    return CompletableFuture.completedFuture(node);
  }

  @Async
  public CompletableFuture<List<Node>> lookUpNodes(
      String branch, Long productId, ModelLevel modelLevel) {

    return CompletableFuture.completedFuture(
        snowstormClient
            // TODO need to change this back from inferred when using the transformed data
            .getConceptsFromInferredEcl(branch, modelLevel.getProductModelEcl(), productId, 0, 100)
            .stream()
            .map(
                concept -> {
                  Node node = new Node();
                  node.setLabel(modelLevel.getDisplayLabel());
                  node.setModelLevel(modelLevel.getModelLevelType());
                  node.setDisplayName(modelLevel.getName());
                  node.setConcept(concept);
                  return node;
                })
            .toList());
  }

  @Async
  public CompletableFuture<Node> generateNodeAsync(
      String branch,
      AtomicCache atomicCache,
      Set<SnowstormRelationship> relationships,
      Set<String> refsets,
      String label,
      Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers,
      Set<SnowstormRelationship> nonDefiningProperties,
      String semanticTag,
      List<String> selectedConceptIdentifiers,
      boolean suppressIsa,
      boolean suppressNegativeStatements,
      boolean enforceRefsets) {
    return CompletableFuture.completedFuture(
        generateNode(
            branch,
            atomicCache,
            relationships,
            refsets,
            label,
            referenceSetMembers,
            nonDefiningProperties,
            semanticTag,
            selectedConceptIdentifiers,
            suppressIsa,
            suppressNegativeStatements,
            enforceRefsets));
  }

  public Node generateNode(
      String branch,
      AtomicCache atomicCache,
      Set<SnowstormRelationship> relationships,
      Set<String> refsets,
      String label,
      Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers,
      Set<SnowstormRelationship> nonDefiningProperties,
      String semanticTag,
      List<String> selectedConceptIdentifiers,
      boolean suppressIsa,
      boolean suppressNegativeStatements,
      boolean enforceRefsets) {

    boolean selectedConcept = false; // indicates if a selected concept has been detected
    Node node = new Node();
    node.setLabel(label);

    // if the relationships are empty or a relationship to a new concept (-ve id)
    // then don't bother looking
    if (!relationships.isEmpty()
        && relationships.stream()
            .noneMatch(
                r ->
                    !Boolean.TRUE.equals(r.getConcrete())
                        && r.getDestinationId() != null
                        && Long.parseLong(r.getDestinationId()) < 0)) {
      String ecl =
          EclBuilder.build(relationships, refsets, suppressIsa, suppressNegativeStatements);

      if (log.isLoggable(Level.FINE)) {
        log.fine("ECL for " + label + " " + ecl);
      }

      Collection<SnowstormConceptMini> matchingConcepts =
          snowstormClient.getConceptsFromEcl(branch, ecl, limit);

      matchingConcepts = filterByOii(branch, relationships, matchingConcepts);

      if (matchingConcepts.isEmpty() && !enforceRefsets) {
        log.info(
            "No concept found for "
                + label
                + " ECL "
                + ecl
                + " trying again without refset constraint");
        ecl = EclBuilder.build(relationships, Set.of(), suppressIsa, suppressNegativeStatements);
      }

      if (log.isLoggable(Level.FINE)) {
        log.fine("ECL for " + label + " " + ecl);
      }

      matchingConcepts = snowstormClient.getConceptsFromEcl(branch, ecl, limit);

      matchingConcepts = filterByOii(branch, relationships, matchingConcepts);

      if (matchingConcepts.isEmpty()) {
        log.warning("No concept found for " + label + " ECL " + ecl);
      } else if (matchingConcepts.size() == 1
          && matchingConcepts.iterator().next().getDefinitionStatus().equals("FULLY_DEFINED")) {
        node.setConcept(matchingConcepts.iterator().next());
        if (node.getLabel().equals(CTPP_LABEL)
            && referenceSetMembers != null) { // populate external identifiers in response

          node.getExternalIdentifiers()
              .addAll(
                  getExternalIdentifiersFromRefsetMemberViewComponents(
                      referenceSetMembers,
                      node.getConceptId(),
                      models.getModelConfiguration(branch).getMappings()));
        }
        atomicCache.addFsn(node.getConceptId(), node.getFullySpecifiedName());
      } else {
        node.setConceptOptions(matchingConcepts);
        Set<SnowstormConceptMini> selectedConcepts =
            matchingConcepts.stream()
                .filter(c -> selectedConceptIdentifiers.contains(c.getConceptId()))
                .collect(Collectors.toSet());

        if (!selectedConcepts.isEmpty()) {
          if (selectedConcepts.size() > 1) {
            throw new SingleConceptExpectedProblem(
                selectedConcepts,
                " Multiple matches for selected concept identifiers "
                    + String.join(", ", selectedConceptIdentifiers));
          }
          node.setConcept(selectedConcepts.iterator().next());
          selectedConcept = true;
        }
      }
    }

    // if there is no single matching concept found, or the user has selected a single concept
    // provide the modelling for a new concept so they can select a new concept as an option.
    if (node.getConcept() == null || selectedConcept) {
      node.setLabel(label);
      NewConceptDetails newConceptDetails = new NewConceptDetails(atomicCache.getNextId());
      SnowstormAxiom axiom = new SnowstormAxiom();
      axiom.active(true);
      axiom.setDefinitionStatusId(
          node.getConceptOptions().isEmpty() ? DEFINED.getValue() : PRIMITIVE.getValue());
      axiom.setDefinitionStatus(node.getConceptOptions().isEmpty() ? "FULLY_DEFINED" : "PRIMITIVE");
      axiom.setRelationships(relationships);
      axiom.setModuleId(SCT_AU_MODULE.getValue());
      axiom.setReleased(false);
      newConceptDetails.setSemanticTag(semanticTag);
      newConceptDetails.getAxioms().add(axiom);
      newConceptDetails.setReferenceSetMembers(referenceSetMembers);
      newConceptDetails.setNonDefiningProperties(nonDefiningProperties);
      node.setNewConceptDetails(newConceptDetails);
      log.fine("New concept for " + label + " " + newConceptDetails.getConceptId());
    } else {
      log.fine("Concept found for " + label + " " + node.getConceptId());
    }

    return node;
  }

  /**
   * Post filters a set of concept to remove those that don't match the OII required by the set of
   * candidate relationships - this is because Snowstorm does not support String type concrete
   * domains in ECL so this is a work around.
   *
   * @param branch branch to check the concepts against
   * @param relationships original candidate relationships to check the concepts against
   * @param matchingConcepts matching concepts to filter that matched the ECL
   * @return filtered down set of matching concepts removing any concepts that don't match the OII
   */
  private Collection<SnowstormConceptMini> filterByOii(
      String branch,
      Set<SnowstormRelationship> relationships,
      Collection<SnowstormConceptMini> matchingConcepts) {
    if (relationships.stream()
        .anyMatch(r -> r.getTypeId().equals(HAS_OTHER_IDENTIFYING_INFORMATION.getValue()))) {
      List<String> oii =
          relationships.stream()
              .filter(r -> r.getTypeId().equals(HAS_OTHER_IDENTIFYING_INFORMATION.getValue()))
              .map(r -> r.getConcreteValue().getValue())
              .toList();

      Set<String> matchingConceptIds =
          matchingConcepts.stream()
              .map(SnowstormConceptMini::getConceptId)
              .collect(Collectors.toSet());

      List<SnowstormConcept> concepts =
          snowstormClient.getBrowserConcepts(branch, matchingConceptIds).collectList().block();
      Set<String> idsWithMatchingOii =
          concepts == null
              ? Set.of()
              : concepts.stream()
                  .filter(
                      c ->
                          c.getClassAxioms().stream()
                              .anyMatch(
                                  a ->
                                      a.getRelationships().stream()
                                          .anyMatch(
                                              r ->
                                                  r.getTypeId()
                                                          .equals(
                                                              HAS_OTHER_IDENTIFYING_INFORMATION
                                                                  .getValue())
                                                      && oii.contains(
                                                          r.getConcreteValue().getValue()))))
                  .map(SnowstormConcept::getConceptId)
                  .collect(Collectors.toSet());

      matchingConcepts =
          matchingConcepts.stream()
              .filter(c -> idsWithMatchingOii.contains(c.getConceptId()))
              .toList();
    }
    return matchingConcepts;
  }

  @Async
  public CompletableFuture<ProductSummary> addTransitiveEdges(
      String branch, Node node, String nodeIdOrClause, ProductSummary productSummary) {
    snowstormClient
        .getConceptsFromEcl(
            branch,
            "(<" + node.getConceptId() + ") AND (" + nodeIdOrClause + ")",
            0,
            productSummary.getNodes().size())
        .stream()
        .map(SnowstormConceptMini::getConceptId)
        .forEach(
            id ->
                productSummary.addEdge(
                    id, node.getConcept().getConceptId(), ProductSummaryService.IS_A_LABEL));
    return CompletableFuture.completedFuture(productSummary);
  }
}
