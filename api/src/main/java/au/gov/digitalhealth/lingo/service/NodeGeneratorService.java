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

import static au.gov.digitalhealth.lingo.util.AmtConstants.*;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.DEFINED;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.PRIMITIVE;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormItemsPageReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormItemsPageRelationship;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.configuration.model.MappingRefset;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.configuration.model.NonDefiningProperty;
import au.gov.digitalhealth.lingo.configuration.model.ReferenceSet;
import au.gov.digitalhealth.lingo.exception.SingleConceptExpectedProblem;
import au.gov.digitalhealth.lingo.product.NewConceptDetails;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.service.fhir.FhirClient;
import au.gov.digitalhealth.lingo.util.EclBuilder;
import au.gov.digitalhealth.lingo.util.ExternalIdentifierUtils;
import au.gov.digitalhealth.lingo.util.NonDefiningPropertyUtils;
import au.gov.digitalhealth.lingo.util.ReferenceSetUtils;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@Log
@EnableAsync
public class NodeGeneratorService {
  SnowstormClient snowstormClient;
  Models models;
  FhirClient fhirClient;

  @Value("${snomio.node.concept.search.limit:50}")
  private int limit;

  @Autowired
  public NodeGeneratorService(
      SnowstormClient snowstormClient, Models models, FhirClient fhirClient) {
    this.snowstormClient = snowstormClient;
    this.models = models;
    this.fhirClient = fhirClient;
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

    populateNodeProperties(branch, modelLevel, node)
        .doOnError(
            e ->
                log.log(
                    Level.WARNING,
                    "Error populating node properties for concept "
                        + node.getConceptId()
                        + ": "
                        + e.getMessage(),
                    e))
        .block();

    return CompletableFuture.completedFuture(node);
  }

  private Mono<Void> populateNodeProperties(String branch, ModelLevel modelLevel, Node node) {
    ModelConfiguration configuration = models.getModelConfiguration(branch);

    Flux<Void> refsetMembersFlux = addRefsetAndMapping(branch, modelLevel, configuration, node);

    Flux<Void> nonDefiningPropertiesFlux =
        addNonDefiningProperties(branch, modelLevel, configuration, node);

    // Create a Mono that completes when both Flux operations complete
    return Mono.when(refsetMembersFlux, nonDefiningPropertiesFlux);
  }

  private Flux<Void> addNonDefiningProperties(
      String branch, ModelLevel modelLevel, ModelConfiguration modelConfiguration, Node node) {

    Map<String, NonDefiningProperty> nonDefiningPropertiesMap =
        modelConfiguration.getNonDefiningPropertiesByIdentifierForModelLevel(modelLevel);

    if (!nonDefiningPropertiesMap.isEmpty()) {
      return snowstormClient
          .getRelationships(branch, node.getConceptId())
          .map(SnowstormItemsPageRelationship::getItems)
          .flatMapMany(Flux::fromIterable)
          .filter(SnowstormRelationship::getActive)
          .flatMap(
              relationship -> {
                if (nonDefiningPropertiesMap.containsKey(relationship.getTypeId())) {
                  node.getNonDefiningProperties()
                      .add(
                          new au.gov.digitalhealth.lingo.product.details.properties
                              .NonDefiningProperty(
                              relationship,
                              nonDefiningPropertiesMap.get(relationship.getTypeId())));
                }
                return Mono.empty();
              })
          .then()
          .flux();
    } else {
      return Flux.empty();
    }
  }

  private Flux<Void> addRefsetAndMapping(
      String branch, ModelLevel modelLevel, ModelConfiguration modelConfiguration, Node node) {
    final Map<String, ReferenceSet> refsetMap =
        modelConfiguration.getReferenceSetsByIdentifierForModelLevel(modelLevel);
    final Map<String, MappingRefset> mappingMap =
        modelConfiguration.getMappingsByIdentifierForModelLevel(modelLevel);

    if (!refsetMap.isEmpty() || !mappingMap.isEmpty()) {

      final Set<String> allRefsetIds = new HashSet<>(refsetMap.keySet());
      allRefsetIds.addAll(mappingMap.keySet());

      // get reference set members for the concept

      return snowstormClient
          .getRefsetMembers(branch, Set.of(node.getConceptId()), allRefsetIds, 0, 1000)
          .map(SnowstormItemsPageReferenceSetMember::getItems)
          .flatMapMany(Flux::fromIterable)
          .filter(SnowstormReferenceSetMember::getActive)
          .flatMap(
              member -> {
                if (refsetMap.containsKey(member.getRefsetId())) {
                  return Mono.just(
                      node.getReferenceSets()
                          .add(
                              new au.gov.digitalhealth.lingo.product.details.properties
                                  .ReferenceSet(member, refsetMap.get(member.getRefsetId()))));
                } else if (mappingMap.containsKey(member.getRefsetId())) {
                  return au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier
                      .create(member, mappingMap.get(member.getRefsetId()), fhirClient)
                      .doOnNext(p -> node.getExternalIdentifiers().add(p))
                      .then(Mono.empty());
                } else {
                  return Mono.empty();
                }
              })
          .then()
          .flux();
    } else {
      return Flux.empty();
    }
  }

  @Async
  public CompletableFuture<List<Node>> lookUpNodes(
      String branch, Long productId, ModelLevel modelLevel) {

    return CompletableFuture.completedFuture(
        snowstormClient
            .getConceptsFromEcl(
                branch,
                modelLevel.getProductModelEcl(),
                productId,
                0,
                100,
                models.getModelConfiguration(branch).isExecuteEclAsStated())
            .stream()
            .map(
                concept -> {
                  Node node = new Node();
                  node.setLabel(modelLevel.getDisplayLabel());
                  node.setModelLevel(modelLevel.getModelLevelType());
                  node.setDisplayName(modelLevel.getName());
                  node.setConcept(concept);
                  final Mono<Void> combinedMono = populateNodeProperties(branch, modelLevel, node);
                  combinedMono.block();
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
      ModelLevel modelLevel,
      String semanticTag,
      Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers,
      Set<SnowstormRelationship> nonDefiningProperties,
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
            modelLevel,
            semanticTag,
            referenceSetMembers,
            nonDefiningProperties,
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
      ModelLevel modelLevel,
      String semanticTag,
      Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers,
      Set<SnowstormRelationship> nonDefiningProperties,
      List<String> selectedConceptIdentifiers,
      boolean suppressIsa,
      boolean suppressNegativeStatements,
      boolean enforceRefsets) {

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    boolean selectedConcept = false; // indicates if a selected concept has been detected
    Node node = new Node();
    node.setLabel(modelLevel.getDisplayLabel());
    node.setDisplayName(modelLevel.getName());
    node.setModelLevel(modelLevel.getModelLevelType());

    String label = modelLevel.getDisplayLabel();

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
          EclBuilder.build(
              relationships, refsets, suppressIsa, suppressNegativeStatements, modelConfiguration);

      if (log.isLoggable(Level.FINE)) {
        log.fine("ECL for " + label + " " + ecl);
      }

      Collection<SnowstormConceptMini> matchingConcepts =
          snowstormClient.getConceptsFromEcl(
              branch, ecl, limit, modelConfiguration.isExecuteEclAsStated());

      matchingConcepts = filterByOii(branch, relationships, matchingConcepts);

      if (matchingConcepts.isEmpty() && !enforceRefsets) {
        log.info(
            "No concept found for "
                + label
                + " ECL "
                + ecl
                + " trying again without refset constraint");
        ecl =
            EclBuilder.build(
                relationships,
                Set.of(),
                suppressIsa,
                suppressNegativeStatements,
                modelConfiguration);

        if (log.isLoggable(Level.FINE)) {
          log.fine("ECL for " + label + " " + ecl);
        }

        matchingConcepts =
            snowstormClient.getConceptsFromEcl(
                branch, ecl, limit, modelConfiguration.isExecuteEclAsStated());

        matchingConcepts = filterByOii(branch, relationships, matchingConcepts);
      }

      if (matchingConcepts.isEmpty()) {
        log.info(
            "No concept found suggesting new concept for "
                + label
                + " ECL was "
                + ecl
                + " branch "
                + branch);
      } else if (matchingConcepts.size() == 1
          && matchingConcepts.iterator().next().getDefinitionStatus().equals("FULLY_DEFINED")) {
        node.setConcept(matchingConcepts.iterator().next());
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
      axiom.setModuleId(modelConfiguration.getModuleId());
      axiom.setReleased(false);
      newConceptDetails.setSemanticTag(semanticTag);
      newConceptDetails.getAxioms().add(axiom);
      newConceptDetails.setReferenceSetMembers(referenceSetMembers);
      newConceptDetails.setNonDefiningProperties(nonDefiningProperties);
      node.setNewConceptDetails(newConceptDetails);
      node.setNonDefiningProperties(
          NonDefiningPropertyUtils.getNonDefiningProperties(
              nonDefiningProperties,
              modelConfiguration.getNonDefiningPropertiesByIdentifierForModelLevel(modelLevel)));
      node.setReferenceSets(
          ReferenceSetUtils.getReferenceSetsFromNewRefsetComponentViewMembers(
              referenceSetMembers,
              modelConfiguration.getReferenceSetsByIdentifierForModelLevel(modelLevel).values()));
      node.setExternalIdentifiers(
          ExternalIdentifierUtils.getExternalIdentifiersFromRefsetMemberViewComponents(
              referenceSetMembers,
              null,
              new HashSet<>(
                  modelConfiguration.getMappingsByIdentifierForModelLevel(modelLevel).values()),
              fhirClient));
      log.fine("New concept for " + label + " " + newConceptDetails.getConceptId());
    } else {
      log.fine("Concept found for " + label + " " + node.getConceptId());

      // look up the non defining properties for the concept
      Flux<Void> refsetMembersFlux =
          addRefsetAndMapping(branch, modelLevel, modelConfiguration, node);

      Flux<Void> nonDefiningPropertiesFlux =
          addNonDefiningProperties(branch, modelLevel, modelConfiguration, node);

      // Create a Mono that completes when both Flux operations complete
      Mono<Void> combinedMono = Mono.when(refsetMembersFlux, nonDefiningPropertiesFlux);

      combinedMono.block();
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
            productSummary.getNodes().size(),
            models.getModelConfiguration(branch).isExecuteEclAsStated())
        .stream()
        .map(SnowstormConceptMini::getConceptId)
        .forEach(
            id ->
                productSummary.addEdge(
                    id, node.getConcept().getConceptId(), ProductSummaryService.IS_A_LABEL));
    return CompletableFuture.completedFuture(productSummary);
  }
}
