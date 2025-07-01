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

import static au.gov.digitalhealth.lingo.util.SemanticTagUtil.extractSemanticTag;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MAP_TARGET;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.*;
import static java.lang.Boolean.TRUE;

import au.csiro.snowstorm_client.model.*;
import au.gov.digitalhealth.lingo.configuration.FieldBindingConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ExternalIdentifierDefinition;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.configuration.model.NonDefiningPropertyDefinition;
import au.gov.digitalhealth.lingo.configuration.model.ReferenceSetDefinition;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.Edge;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.OriginalNode;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.ProductDetails;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningBase;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty;
import au.gov.digitalhealth.lingo.product.update.ProductDescriptionUpdateRequest;
import au.gov.digitalhealth.lingo.product.update.ProductPropertiesUpdateRequest;
import au.gov.digitalhealth.lingo.util.InactivationReason;
import au.gov.digitalhealth.lingo.util.NonDefiningPropertiesConverter;
import au.gov.digitalhealth.tickets.service.TicketServiceImpl;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.*;
import java.util.Map.Entry;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

@Log
@Service
public class ProductUpdateService {

  SnowstormClient snowstormClient;
  TicketServiceImpl ticketService;
  FieldBindingConfiguration fieldBindingConfiguration;
  Models models;
  ProductSummaryService productSummaryService;
  ProductCalculationServiceFactory productCalculationServiceFactory;

  public ProductUpdateService(
      SnowstormClient snowstormClient,
      TicketServiceImpl ticketService,
      FieldBindingConfiguration fieldBindingConfiguration,
      Models models,
      ProductSummaryService productSummaryService,
      ProductCalculationServiceFactory productCalculationServiceFactory) {
    this.snowstormClient = snowstormClient;

    this.ticketService = ticketService;
    this.fieldBindingConfiguration = fieldBindingConfiguration;
    this.models = models;
    this.productSummaryService = productSummaryService;
    this.productCalculationServiceFactory = productCalculationServiceFactory;
  }

  private static String getIdentifierKey(ExternalIdentifierDefinition m, ExternalIdentifier id) {
    return m.getIdentifier()
        + " "
        + (id.getValue() == null ? id.getValueObject().getConceptId() : id.getValue());
  }

  private static String getIdentifierKey(SnowstormReferenceSetMember id) {
    if (id.getAdditionalFields() == null
        || !id.getAdditionalFields().containsKey(MAP_TARGET.getValue())) {
      throw new ProductAtomicDataValidationProblem(
          "Mapping refset member does not contain a map target: " + id);
    }
    return id.getRefsetId() + " " + id.getAdditionalFields().get(MAP_TARGET.getValue());
  }

  private static String getNonDefiningPropertyKeyForRelationship(
      SnowstormRelationship relationship) {
    String value;
    if (TRUE.equals(relationship.getConcrete())) {
      if (relationship.getConcreteValue() == null) {
        throw new ProductAtomicDataValidationProblem(
            "Concrete value is null for relationship: " + relationship);
      }
      value = relationship.getConcreteValue().getValue();
    } else {
      if (relationship.getDestinationId() == null) {
        throw new ProductAtomicDataValidationProblem(
            "Destination ID is null for relationship: " + relationship);
      }
      value = relationship.getDestinationId();
    }

    return relationship.getTypeId() + " " + value;
  }

  private static String getNonDefiningPropertyKey(
      NonDefiningPropertyDefinition nonDefiningPropertyDefinition, NonDefiningProperty prop) {

    final String value =
        prop.getValue() == null ? prop.getValueObject().getConceptId() : prop.getValue();

    return nonDefiningPropertyDefinition.getIdentifier() + " " + value;
  }

  public SnowstormConceptMini updateProductDescriptions(
      String branch,
      String productId,
      @Valid ProductDescriptionUpdateRequest productDescriptionUpdateRequest) {

    // Retrieve and update concepts
    List<SnowstormConcept> existingConcepts = fetchBrowserConcepts(branch, Set.of(productId));
    SnowstormConceptView conceptsNeedUpdate =
        prepareConceptUpdate(existingConcepts.get(0), productDescriptionUpdateRequest, branch);

    if (conceptsNeedUpdate != null) {
      try {
        SnowstormConceptView updatedConcept =
            snowstormClient.updateConcept(
                branch, conceptsNeedUpdate.getConceptId(), conceptsNeedUpdate, false);
        return toSnowstormConceptMini(updatedConcept);
      } catch (WebClientResponseException ex) {

        String errorBody = ex.getResponseBodyAsString();

        throw new ProductAtomicDataValidationProblem(String.format("%s", errorBody));
      }
    }
    return toSnowstormConceptMini(existingConcepts.get(0));
  }

  private SnowstormConceptView prepareConceptUpdate(
      SnowstormConcept existingConcept,
      ProductDescriptionUpdateRequest productDescriptionUpdateRequest,
      String branch) {
    if (productDescriptionUpdateRequest == null) return null;

    boolean areDescriptionsModified =
        productDescriptionUpdateRequest.areDescriptionsModified(existingConcept.getDescriptions());

    if (!areDescriptionsModified) {
      throw new ProductAtomicDataValidationProblem("No descriptions modified");
    }
    SnowstormConceptView conceptNeedToUpdate = toSnowstormConceptView(existingConcept);

    String fsn =
        getFsnFromDescriptions(productDescriptionUpdateRequest.getDescriptions()).getTerm();
    String existingFsn =
        Objects.requireNonNull(
                existingConcept.getFsn(),
                "Concept " + existingConcept.getConceptId() + " has no FSN")
            .getTerm();
    if (fsn != null && existingFsn != null && !existingFsn.equals(fsn.trim())) {
      String newFsn = fsn.trim();

      String semanticTag = extractSemanticTag(existingFsn);
      if (semanticTag != null && !newFsn.endsWith(semanticTag)) {
        throw new ProductAtomicDataValidationProblem(
            String.format(
                "The required semantic tag \"%s\" is missing from the FSN \"%s\".",
                semanticTag, newFsn));
      }
      snowstormClient.checkForDuplicateFsn(newFsn, branch);
    }

    // if snowstorm does not recieve the retired descriptions... it is going to delete them
    Set<SnowstormDescription> retiredDescriptions =
        conceptNeedToUpdate.getDescriptions().stream()
            .filter(desc -> Boolean.FALSE.equals(desc.getActive()))
            .collect(Collectors.toSet());

    productDescriptionUpdateRequest.getDescriptions().addAll(retiredDescriptions);
    conceptNeedToUpdate.setDescriptions(productDescriptionUpdateRequest.getDescriptions());

    return conceptNeedToUpdate;
  }

  public List<SnowstormConcept> fetchBrowserConcepts(String branch, Set<String> conceptIds) {
    return snowstormClient
        .getBrowserConcepts(branch, conceptIds)
        .collect(Collectors.toList())
        .block();
  }

  public Collection<NonDefiningBase> updateProductProperties(
      String branch,
      String conceptId,
      ProductPropertiesUpdateRequest productPropertiesUpdateRequest)
      throws InterruptedException {

    HashSet<NonDefiningBase> nonDefiningBaseSet = new HashSet<>();

    // Handle external identifiers and reference sets
    nonDefiningBaseSet.addAll(
        handleExternalIdentifiersAndReferenceSets(
            branch, conceptId, productPropertiesUpdateRequest));
    // Handle non-defining properties
    nonDefiningBaseSet.addAll(
        handleNonDefiningProperties(branch, conceptId, productPropertiesUpdateRequest));
    return nonDefiningBaseSet;
  }

  private Collection<NonDefiningBase> handleExternalIdentifiersAndReferenceSets(
      String branch,
      String conceptId,
      ProductPropertiesUpdateRequest productPropertiesUpdateRequest)
      throws InterruptedException {
    Map<String, ExternalIdentifierDefinition> mappingRefsets =
        models.getModelConfiguration(branch).getMappingsByName();
    Map<String, ReferenceSetDefinition> referenceSetDefinitionMap =
        models.getModelConfiguration(branch).getReferenceSetsByName();

    Map<String, NonDefiningBase> requestedExternalIdentifiers =
        productPropertiesUpdateRequest.getNonDefiningProperties().stream()
            .filter(
                id ->
                    mappingRefsets.containsKey(id.getIdentifierScheme())
                        || referenceSetDefinitionMap.containsKey(id.getIdentifierScheme()))
            .collect(
                Collectors.toMap(
                    id ->
                        mappingRefsets.get(id.getIdentifierScheme()) == null
                            ? id.getIdentifierScheme()
                            : getIdentifierKey(
                                mappingRefsets.get(id.getIdentifierScheme()),
                                (ExternalIdentifier) id),
                    id -> id));

    Map<String, SnowstormReferenceSetMember> existingMembers =
        snowstormClient
            .getRefsetMembers(
                branch,
                Set.of(conceptId),
                mappingRefsets.values().stream()
                    .map(ExternalIdentifierDefinition::getIdentifier)
                    .collect(Collectors.toSet()))
            .stream()
            .filter(r -> r.getActive() != null && r.getActive())
            .collect(Collectors.toMap(ProductUpdateService::getIdentifierKey, r -> r));

    Set<SnowstormReferenceSetMember> idsToBeRemoved =
        existingMembers.entrySet().stream()
            .filter(entry -> !requestedExternalIdentifiers.containsKey(entry.getKey()))
            .map(Entry::getValue)
            .collect(Collectors.toSet());

    Set<SnowstormReferenceSetMemberViewComponent> idsToBeAdded =
        requestedExternalIdentifiers.entrySet().stream()
            .filter(entry -> !existingMembers.containsKey(entry.getKey()))
            .map(
                entry ->
                    createSnowstormReferenceSetMemberViewComponent(
                        entry.getValue(),
                        conceptId,
                        mappingRefsets.values(),
                        referenceSetDefinitionMap.values()))
            .collect(Collectors.toSet());

    if (!idsToBeAdded.isEmpty()) {
      // Create new members in Snowstorm
      snowstormClient.createRefsetMembers(branch, List.copyOf(idsToBeAdded));
    }

    if (!idsToBeRemoved.isEmpty()) {
      // Remove outdated members from Snowstorm
      snowstormClient.removeRefsetMembers(branch, idsToBeRemoved);
    }
    return requestedExternalIdentifiers.values();
  }

  public Collection<NonDefiningProperty> handleNonDefiningProperties(
      String branch, String conceptId, @Valid ProductPropertiesUpdateRequest updateRequest) {

    Map<String, NonDefiningPropertyDefinition> nonDefiningPropertiesByName =
        models.getModelConfiguration(branch).getNonDefiningPropertiesByName();

    Map<String, NonDefiningProperty> requestedProperties =
        updateRequest.getNonDefiningProperties().stream()
            .filter(prop -> nonDefiningPropertiesByName.containsKey(prop.getIdentifierScheme()))
            .map(p -> (NonDefiningProperty) p)
            .collect(
                Collectors.toMap(
                    prop ->
                        getNonDefiningPropertyKey(
                            nonDefiningPropertiesByName.get(prop.getIdentifierScheme()), prop),
                    prop -> prop));

    Set<String> definedTypeIds =
        nonDefiningPropertiesByName.values().stream()
            .map(NonDefiningPropertyDefinition::getIdentifier)
            .collect(Collectors.toSet());

    final SnowstormConcept browserConcept =
        snowstormClient.getBrowserConcepts(branch, Set.of(conceptId)).blockFirst();

    if (browserConcept == null) {
      throw new ProductAtomicDataValidationProblem(
          "Concept with ID " + conceptId + " does not exist in branch " + branch);
    }

    Map<String, SnowstormRelationship> existingProperties =
        browserConcept.getRelationships().stream()
            .filter(
                r ->
                    r.getActive() != null
                        && r.getActive()
                        && definedTypeIds.contains(r.getTypeId()))
            .collect(
                Collectors.toMap(
                    ProductUpdateService::getNonDefiningPropertyKeyForRelationship, r -> r));

    Set<SnowstormRelationship> idsToBeRemoved =
        existingProperties.entrySet().stream()
            .filter(entry -> !requestedProperties.containsKey(entry.getKey()))
            .map(Entry::getValue)
            .collect(Collectors.toSet());

    Set<SnowstormRelationship> idsToBeAdded =
        requestedProperties.entrySet().stream()
            .filter(entry -> !existingProperties.containsKey(entry.getKey()))
            .map(
                entry ->
                    NonDefiningPropertiesConverter.calculateNonDefiningRelationships(
                        entry.getValue(),
                        conceptId,
                        nonDefiningPropertiesByName.values(),
                        models.getModelConfiguration(branch).getModuleId()))
            .collect(Collectors.toSet());

    if (!idsToBeAdded.isEmpty() || !idsToBeRemoved.isEmpty()) {

      browserConcept.getRelationships().removeAll(idsToBeRemoved);
      browserConcept.getRelationships().addAll(idsToBeAdded);
      snowstormClient.updateConcept(
          branch, conceptId, toSnowstormConceptView(browserConcept), false);
    }

    return requestedProperties.values();
  }

  public <T extends ProductDetails> ProductSummary calculateUpdateProductFromAtomicData(
      String branch, Long productId, @Valid PackageDetails<T> productDetails)
      throws ExecutionException, InterruptedException {

    Mono<List<String>> taskChangedConceptIds = snowstormClient.getConceptIdsChangedOnTask(branch);

    Mono<List<String>> projectChangedConceptIds =
        snowstormClient.getConceptIdsChangedOnProject(branch);

    // async call to get product summary by productId
    CompletableFuture<ProductSummary> existingProductSummary =
        productSummaryService.getProductSummaryAsync(branch, productId.toString());

    // Get the actual class of T using reflection on a concrete instance
    Class<T> productDetailsClass = null;
    if (!productDetails.getContainedProducts().isEmpty()) {
      @SuppressWarnings("unchecked")
      Class<T> cls =
          (Class<T>) productDetails.getContainedProducts().get(0).getProductDetails().getClass();
      productDetailsClass = cls;
    } else if (!productDetails.getContainedPackages().isEmpty()) {
      @SuppressWarnings("unchecked")
      Class<T> cls =
          (Class<T>)
              productDetails
                  .getContainedPackages()
                  .get(0)
                  .getPackageDetails()
                  .getContainedProducts()
                  .get(0)
                  .getProductDetails()
                  .getClass();
      productDetailsClass = cls;
    }

    if (productDetailsClass == null) {
      throw new IllegalArgumentException("Cannot determine product details class");
    }

    // async call to calculate the product from atomic data
    CompletableFuture<ProductSummary> newProductSummary =
        productCalculationServiceFactory
            .getCalculationService(productDetailsClass)
            .calculateProductFromAtomicDataAsync(branch, productDetails);

    CompletableFuture.allOf(existingProductSummary, newProductSummary).join();

    ProductSummary existingSummary = existingProductSummary.get();
    ProductSummary newSummary = newProductSummary.get();

    // correlate the existing product summary nodes to the new product summary nodes
    Map<String, Node> existingNodesByConceptId =
        existingSummary.getNodes().stream()
            .collect(Collectors.toMap(Node::getConceptId, Function.identity()));

    Set<String> allocatedExistingNodes = new HashSet<>();

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);
    newSummary.getNodes().stream()
        .filter(
            node ->
                !node.isNewConcept() && existingNodesByConceptId.containsKey(node.getConceptId()))
        .forEach(node -> allocatedExistingNodes.add(node.getConceptId()));

    // for all the new nodes in the new summary, find the corresponding exisitng node
    newSummary.getNodes().stream()
        .filter(
            node ->
                node.isNewConcept()
                    || node.getOriginalNode() == null
                    || !existingNodesByConceptId.containsKey(node.getOriginalNode().getConceptId()))
        .forEach(
            newNode -> {
              final Node bestMatchingNode =
                  getBestMatchingNode(newNode, existingNodesByConceptId, allocatedExistingNodes);
              if (bestMatchingNode != null) {
                newNode.setOriginalNode(new OriginalNode(bestMatchingNode, null, true));
                allocatedExistingNodes.add(bestMatchingNode.getConceptId());
              }
            });

    // include in the product summary all the unmatched existing nodes
    existingNodesByConceptId.values().stream()
        .filter(node -> !allocatedExistingNodes.contains(node.getConceptId()))
        .forEach(
            node ->
                newSummary
                    .getUnmatchedPreviouslyReferencedNodes()
                    .add(new OriginalNode(node, null, true)));

    // update all the existing nodes to indicate if they are referenced by other concepts outside
    // the ones in the summary
    Set<String> replacedConceptIds =
        newSummary.getNodes().stream()
            .filter(
                node ->
                    node.getOriginalNode() != null
                        && !node.getConceptId()
                            .equals(node.getOriginalNode().getNode().getConceptId()))
            .map(node -> node.getOriginalNode().getNode().getConceptId())
            .collect(Collectors.toSet());
    replacedConceptIds.addAll(
        newSummary.getUnmatchedPreviouslyReferencedNodes().stream()
            .map(on -> on.getNode().getConceptId())
            .collect(Collectors.toSet()));

    Map<String, OriginalNode> originalNodes =
        new HashMap<>(
            newSummary.getUnmatchedPreviouslyReferencedNodes().stream()
                .collect(Collectors.toMap(OriginalNode::getConceptId, Function.identity())));
    originalNodes.putAll(
        newSummary.getNodes().stream()
            .map(Node::getOriginalNode)
            .filter(Objects::nonNull)
            .collect(Collectors.toMap(on -> on.getNode().getConceptId(), Function.identity())));

    List<String> taskChangedIds = taskChangedConceptIds.block();
    List<String> projectChangedIds = projectChangedConceptIds.block();

    newSummary
        .getNodes()
        .forEach(
            node -> {
              node.setNewInTask(
                  taskChangedIds != null && taskChangedIds.contains(node.getConceptId()));
              node.setNewInProject(
                  projectChangedIds != null && projectChangedIds.contains(node.getConceptId()));
              if (node.getOriginalNode() != null && node.getOriginalNode().getNode() != null) {
                node.getOriginalNode()
                    .getNode()
                    .setNewInTask(
                        taskChangedIds != null && taskChangedIds.contains(node.getConceptId()));
                node.getOriginalNode()
                    .getNode()
                    .setNewInProject(
                        projectChangedIds != null
                            && projectChangedIds.contains(node.getConceptId()));
              }
            });

    List<CompletableFuture<Void>> referencedByOtherProductsFutures = new ArrayList<>();
    originalNodes
        .values()
        .forEach(
            node -> {
              String originalConceptId = node.getNode().getConceptId();

              referencedByOtherProductsFutures.add(
                  snowstormClient
                      .getConceptIdsFromEclAsync(
                          branch,
                          "(<" + originalConceptId + ") or (*:*=" + originalConceptId + ")",
                          0,
                          100,
                          modelConfiguration.isExecuteEclAsStated())
                      .thenAccept(
                          c -> {
                            final boolean referencedByOtherProducts =
                                !replacedConceptIds.containsAll(c);

                            node.setReferencedByOtherProducts(referencedByOtherProducts);
                            // if the node is referenced by other products, it should not be
                            // inactivated
                            // if it is new in task or project, it should be edited rather than
                            // inactivated
                            node.setInactivationReason(
                                referencedByOtherProducts
                                        || (node.getNode().isNewInTask()
                                            || node.getNode().isNewInProject())
                                    ? null
                                    : InactivationReason.ERRONEOUS);
                          }));
            });

    CompletableFuture.allOf(referencedByOtherProductsFutures.toArray(new CompletableFuture[0]))
        .join();

    markDependentNodesAsReferenced(originalNodes, existingProductSummary.get().getEdges());

    return newSummary;
  }

  /**
   * Propagates reference status to dependent nodes in a directed graph.
   *
   * <p>This method iterates through nodes in dependency order (from least to most dependent) and
   * updates their reference status based on their dependencies. If a node is referenced by other
   * products, any nodes that depend on it (through directed edges) will also be marked as
   * referenced by other products.
   *
   * <p>The nodes are sorted to ensure proper propagation: 1. Nodes referenced by other nodes appear
   * before nodes that reference them 2. When no direct reference exists, nodes with fewer incoming
   * edges appear first 3. For nodes with equal incoming edges, sorting is by conceptId for
   * deterministic results
   *
   * @param originalNodes Map of concept IDs to their node representations
   * @param edges Set of directed edges connecting the nodes
   */
  private void markDependentNodesAsReferenced(
      Map<String, OriginalNode> originalNodes, @NotNull @NotEmpty Set<@Valid Edge> edges) {

    List<OriginalNode> sortedOriginalNodes =
        originalNodes.values().stream()
            .sorted(
                (node1, node2) -> {
                  String id1 = node1.getConceptId();
                  String id2 = node2.getConceptId();

                  // Check references
                  boolean node1ReferencesNode2 =
                      edges.stream()
                          .anyMatch(e -> e.getSource().equals(id1) && e.getTarget().equals(id2));
                  boolean node2ReferencesNode1 =
                      edges.stream()
                          .anyMatch(e -> e.getSource().equals(id2) && e.getTarget().equals(id1));

                  if (node1ReferencesNode2 && node2ReferencesNode1) {
                    throw new IllegalStateException(
                        "Circular reference detected between nodes: " + id1 + " and " + id2);
                  }

                  if (node1ReferencesNode2 && !node2ReferencesNode1) {
                    return 1;
                  }
                  if (node2ReferencesNode1 && !node1ReferencesNode2) {
                    return -1;
                  }

                  // Compare by incoming edges
                  long incomingCount1 =
                      edges.stream().filter(e -> e.getTarget().equals(id1)).count();
                  long incomingCount2 =
                      edges.stream().filter(e -> e.getTarget().equals(id2)).count();

                  if (incomingCount1 != incomingCount2) {
                    return Long.compare(incomingCount1, incomingCount2);
                  }

                  // Sort by conceptId as final tie-breaker
                  return id1.compareTo(id2);
                })
            .toList();

    for (OriginalNode originalNode : sortedOriginalNodes) {
      if (!originalNode.isReferencedByOtherProducts()
          && edges.stream()
              .anyMatch(
                  e ->
                      e.getTarget().equals(originalNode.getConceptId())
                          && originalNodes.get(e.getSource()).isReferencedByOtherProducts())) {

        originalNode.setReferencedByOtherProducts(true);
      }
    }
  }

  /**
   * Finds the best matching existing node for the specified new node from existingNodesByConceptId
   * discounting any nodes that have already been allocated to other new nodes in
   * allocatedExistingNodes. Matches are based on best fully specified name match and limited to
   * nodes of the same ModelLevelType.
   */
  private Node getBestMatchingNode(
      @Valid Node newNode,
      Map<String, Node> existingNodesByConceptId,
      Set<String> allocatedExistingNodes) {
    return existingNodesByConceptId.values().stream()
        .filter(node -> !allocatedExistingNodes.contains(node.getConceptId()))
        .filter(node -> node.getModelLevel().equals(newNode.getModelLevel()))
        .filter(
            node ->
                node.getFullySpecifiedName() != null
                    && newNode.getFullySpecifiedName() != null
                    && StringUtils.hasText(node.getFullySpecifiedName())
                    && StringUtils.hasText(newNode.getFullySpecifiedName()))
        .min(
            (a, b) ->
                Double.compare(
                    calculateLevenshteinDistance(
                        a.getFullySpecifiedName(), newNode.getFullySpecifiedName()),
                    calculateLevenshteinDistance(
                        b.getFullySpecifiedName(), newNode.getFullySpecifiedName())))
        .orElse(null);
  }

  private double calculateLevenshteinDistance(String str1, String str2) {
    int[][] dp = new int[str1.length() + 1][str2.length() + 1];

    for (int i = 0; i <= str1.length(); i++) {
      dp[i][0] = i;
    }

    for (int j = 0; j <= str2.length(); j++) {
      dp[0][j] = j;
    }

    for (int i = 1; i <= str1.length(); i++) {
      for (int j = 1; j <= str2.length(); j++) {
        if (str1.charAt(i - 1) == str2.charAt(j - 1)) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
        }
      }
    }

    return dp[str1.length()][str2.length()] / (double) Math.max(str1.length(), str2.length());
  }
}
