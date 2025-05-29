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


import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.product.Edge;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/** Service for product-centric operations */
@Service
@Log
public class ProductSummaryService {

  public static final String CONTAINS_LABEL = "contains";
  public static final String HAS_PRODUCT_NAME_LABEL = "has product name";
  public static final String CTPP_LABEL = "CTPP";
  public static final String TPP_LABEL = "TPP";
  public static final String MPP_LABEL = "MPP";
  public static final String IS_A_LABEL = "is a";
  public static final String TP_LABEL = "TP";
  public static final String TPUU_LABEL = "TPUU";
  public static final String MPUU_LABEL = "MPUU";
  public static final String MP_LABEL = "MP";
  private final SnowstormClient snowStormApiClient;
  private final NodeGeneratorService nodeGeneratorService;
  private final Models models;

  ProductSummaryService(
      SnowstormClient snowStormApiClient,
      NodeGeneratorService nodeGeneratorService,
      Models models) {
    this.snowStormApiClient = snowStormApiClient;
    this.nodeGeneratorService = nodeGeneratorService;
    this.models = models;
  }

  public static Set<Edge> getTransitiveEdges(
      ProductSummary productSummary, Set<Edge> transitiveContainsEdges) {
    int beginningTransitiveEdgeSize = transitiveContainsEdges.size();

    for (Edge edge : productSummary.getEdges()) {
      for (Edge edge2 : productSummary.getEdges()) {
        if (edge2.getSource().equals(edge.getTarget())) {
          if (edge.getLabel().equals(CONTAINS_LABEL)
              && (edge2.getLabel().equals(CONTAINS_LABEL) || edge2.getLabel().equals(IS_A_LABEL))) {
            // CONTAINS_LABEL o CONTAINS_LABEL -> CONTAINS_LABEL
            // CONTAINS_LABEL o IS_A_LABEL -> CONTAINS_LABEL
            transitiveContainsEdges.add(
                new Edge(edge.getSource(), edge2.getTarget(), CONTAINS_LABEL));
          } else if (edge.getLabel().equals(IS_A_LABEL)
              && edge2.getLabel().equals(CONTAINS_LABEL)) {
            // IS_A_LABEL o CONTAINS_LABEL -> CONTAINS_LABEL
            transitiveContainsEdges.add(
                new Edge(edge.getSource(), edge2.getTarget(), CONTAINS_LABEL));
          } else if (edge.getLabel().equals(IS_A_LABEL) && edge2.getLabel().equals(IS_A_LABEL)) {
            // IS_A_LABEL o IS_A_LABEL -> IS_A_LABEL
            transitiveContainsEdges.add(new Edge(edge.getSource(), edge2.getTarget(), IS_A_LABEL));
          }
        }
      }
    }

    productSummary.getEdges().addAll(transitiveContainsEdges);

    if (beginningTransitiveEdgeSize != transitiveContainsEdges.size()) {
      return getTransitiveEdges(productSummary, transitiveContainsEdges);
    }
    return transitiveContainsEdges;
  }

  public ProductSummary getProductSummary(String branch, String productId) {
    log.info("Getting product model for " + productId + " on branch " + branch);

    log.fine("Adding concepts and relationships for " + productId);
    final ProductSummary productSummary = new ProductSummary();

    Mono<List<String>> taskChangedConceptIds =
        snowStormApiClient.getConceptIdsChangedOnTask(branch);

    Mono<List<String>> projectChangedConceptIds =
        snowStormApiClient.getConceptIdsChangedOnProject(branch);

    ModelConfiguration model = models.getModelConfiguration(branch);

    addConceptsAndRelationshipsForProduct(branch, productId, null, productSummary, model).join();

    log.fine("Calculating transitive relationships for product model for " + productId);

    String nodeIdOrClause =
        productSummary.getNodes().stream()
            .map(Node::getConceptId)
            .collect(Collectors.joining(" OR "));

    Set<CompletableFuture<ProductSummary>> futures = new HashSet<>();
    productSummary.getNodes().stream()
        .filter(
            n ->
                model.getLevels().stream()
                    .filter(ModelLevel::isBranded)
                    .map(ModelLevel::getModelLevelType)
                    .noneMatch(n.getModelLevel()::equals))
        .forEach(
            n ->
                futures.add(
                    nodeGeneratorService.addTransitiveEdges(
                        branch, n, nodeIdOrClause, productSummary)));
    CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
    Set<Edge> transitiveContainsEdges = getTransitiveEdges(productSummary, new HashSet<>());

    productSummary.getEdges().addAll(transitiveContainsEdges);

    productSummary.updateNodeChangeStatus(
        taskChangedConceptIds.block(), projectChangedConceptIds.block());

    log.info("Done product model for " + productId + " on branch " + branch);
    return productSummary;
  }

  CompletableFuture<ProductSummary> addConceptsAndRelationshipsForProduct(
      String branch,
      String productId,
      Map<ModelLevel, CompletableFuture<Node>> outerPackageNodes,
      ProductSummary productSummary,
      ModelConfiguration model) {

    Set<ModelLevel> packagModelLevels = model.getPackageLevels();
    long productIdLong = Long.parseLong(productId);

    Set<CompletableFuture<?>> futures = Collections.synchronizedSet(new HashSet<>());

    Map<ModelLevel, CompletableFuture<Node>> packageLevelNodeMap = new HashMap<>();
    for (ModelLevel modelLevel : packagModelLevels) {
      CompletableFuture<Node> node =
          nodeGeneratorService
              .lookUpNode(branch, productIdLong, modelLevel)
              .thenApply(
                  c -> {
                    productSummary.addNode(c);
                    if (modelLevel.isLeafLevel(packagModelLevels)
                        && (productSummary.getSubjects() == null
                            || productSummary.getSubjects().isEmpty())) {
                      // set this for the first, outermost package node
                      productSummary.setSingleSubject(c);
                    }
                    return c;
                  });
      futures.add(node);
      packageLevelNodeMap.put(modelLevel, node);
    }

    CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
        .thenCompose(
            v -> {
              // Create a list to hold all the edge-creation futures
              Set<CompletableFuture<Void>> edgeFutures = new HashSet<>();

              // Process each model level asynchronously
              for (ModelLevel modelLevel : packagModelLevels) {
                // Get the child node future
                CompletableFuture<Node> childNodeFuture = packageLevelNodeMap.get(modelLevel);

                // Create parent-child relationship if needed
                if (!model.getParentModelLevels(modelLevel.getModelLevelType()).isEmpty()) {

                  for (ModelLevel parentLevel :
                      model.getParentModelLevels(modelLevel.getModelLevelType())) {
                    // Get the parent node future
                    CompletableFuture<Node> parentNodeFuture = packageLevelNodeMap.get(parentLevel);

                    // Create a future for adding the parent-child edge
                    CompletableFuture<Void> parentEdgeFuture =
                        childNodeFuture.thenCombine(
                            parentNodeFuture,
                            (childNode, parentNode) -> {
                              productSummary.addEdge(
                                  childNode.getConcept().getConceptId(),
                                  parentNode.getConcept().getConceptId(),
                                  IS_A_LABEL);
                              return null;
                            });

                    edgeFutures.add(parentEdgeFuture);
                  }
                }

                // Create outer-inner package relationship if needed
                if (outerPackageNodes != null && !outerPackageNodes.isEmpty()) {
                  CompletableFuture<Node> outerNodeFuture = outerPackageNodes.get(modelLevel);

                  // Create a future for adding the outer-inner edge
                  CompletableFuture<Void> outerEdgeFuture =
                      childNodeFuture.thenCombine(
                          outerNodeFuture,
                          (childNode, outerNode) -> {
                            if (outerNode != null) {
                              productSummary.addEdge(
                                  outerNode.getConcept().getConceptId(),
                                  childNode.getConcept().getConceptId(),
                                  CONTAINS_LABEL);
                            }
                            return null;
                          });

                  edgeFutures.add(outerEdgeFuture);
                }
              }

              // Wait for all edge creations to complete
              return CompletableFuture.allOf(edgeFutures.toArray(new CompletableFuture[0]));
            })
        .join();

    if ((outerPackageNodes == null || outerPackageNodes.isEmpty())
        && (model.getSubpackFromPackageEcl() != null
            && !model.getSubpackFromPackageEcl().isBlank())) {
      Collection<String> subpackCtppIds =
          snowStormApiClient.getConceptsIdsFromEcl(
              branch,
              model.getSubpackFromPackageEcl(),
              Long.parseLong(productId),
              0,
              100,
              models.getModelConfiguration(branch).isExecuteEclAsStated());

      futures.addAll(
          subpackCtppIds.stream()
              .map(
                  subpackCtppId ->
                      addConceptsAndRelationshipsForProduct(
                          branch, subpackCtppId, packageLevelNodeMap, productSummary, model))
              .toList());
    }

    if (model.containsModelLevel(ModelLevelType.PRODUCT_NAME)) {
      ModelLevel productNameLevel = model.getLevelOfType(ModelLevelType.PRODUCT_NAME);
      futures.add(
          nodeGeneratorService
              .lookUpNode(branch, productIdLong, productNameLevel)
              .thenApply(
                  c -> {
                    productSummary.addNode(c);
                    for (ModelLevel modelLevel : packagModelLevels) {
                      if (modelLevel.getModelLevelType().isBranded()) {
                        Node packageNode =
                            packageLevelNodeMap
                                .get(model.getLevelOfType(modelLevel.getModelLevelType()))
                                .join();

                        productSummary.addEdge(
                            packageNode.getConcept().getConceptId(),
                            c.getConcept().getConceptId(),
                            HAS_PRODUCT_NAME_LABEL);
                      }
                    }
                    return c;
                  }));
    }

    Set<ModelLevel> productModelLevels = model.getProductLevels();

    ModelLevel leafProductLevel = ModelLevel.getLeafLevel(productModelLevels);
    CompletableFuture<Void> productNodesFuture =
        nodeGeneratorService
            .lookUpNodes(branch, productIdLong, leafProductLevel)
            .thenCompose(
                productNodes -> {
                  Set<CompletableFuture<Void>> productFutures =
                      Collections.synchronizedSet(new HashSet<>());
                  for (Node node : productNodes) {
                    productFutures.add(
                        processProductNode(
                            branch,
                            productSummary,
                            model,
                            node,
                            packagModelLevels,
                            packageLevelNodeMap));
                  }
                  return CompletableFuture.allOf(productFutures.toArray(new CompletableFuture[0]));
                });

    futures.add(productNodesFuture);
    CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
    return CompletableFuture.completedFuture(productSummary);
  }

  private CompletableFuture<Void> processProductNode(
      String branch,
      ProductSummary productSummary,
      ModelConfiguration model,
      Node productNode,
      Set<ModelLevel> packagModelLevels,
      Map<ModelLevel, CompletableFuture<Node>> packageLevelNodeMap) {

    Set<CompletableFuture<?>> futures = Collections.synchronizedSet(new HashSet<>());

    productSummary.addNode(productNode);
    // attach to the package nodes
    for (ModelLevel modelLevel :
        packagModelLevels.stream()
            .filter(
                l -> l.getModelLevelType().isBranded() == productNode.getModelLevel().isBranded())
            .toList()) {

      CompletableFuture<Node> packageNodeFuture =
          packageLevelNodeMap.get(model.getLevelOfType(modelLevel.getModelLevelType()));

      // Create a future for adding the edge (don't block!)
      CompletableFuture<Void> edgeFuture =
          packageNodeFuture.thenAccept(
              packageNode ->
                  productSummary.addEdge(
                      packageNode.getConcept().getConceptId(),
                      productNode.getConcept().getConceptId(),
                      CONTAINS_LABEL));
      futures.add(edgeFuture);
    }

    if (model.containsModelLevel(ModelLevelType.PRODUCT_NAME)
        && productNode.getModelLevel().isBranded()) {
      ModelLevel productNameLevel = model.getLevelOfType(ModelLevelType.PRODUCT_NAME);
      futures.add(
          nodeGeneratorService
              .lookUpNode(
                  branch, Long.parseLong(productNode.getConcept().getConceptId()), productNameLevel)
              .thenCompose(
                  productName -> {
                    productSummary.addNode(productName);

                    // Gather all the futures for creating edges
                    Set<CompletableFuture<Void>> edgeFutures = new HashSet<>();

                    for (ModelLevel modelLevel : packagModelLevels) {
                      if (modelLevel.getModelLevelType().isBranded()) {
                        // Get the future for the package node
                        CompletableFuture<Node> packageNodeFuture =
                            packageLevelNodeMap.get(
                                model.getLevelOfType(modelLevel.getModelLevelType()));

                        // Create a future for adding the edge (don't block!)
                        CompletableFuture<Void> edgeFuture =
                            packageNodeFuture.thenAccept(
                                packageNode ->
                                    productSummary.addEdge(
                                        productNode.getConcept().getConceptId(),
                                        productName.getConcept().getConceptId(),
                                        HAS_PRODUCT_NAME_LABEL));

                        edgeFutures.add(edgeFuture);
                      }
                    }

                    // Wait for all edge creations to complete, then return the productName
                    return CompletableFuture.allOf(edgeFutures.toArray(new CompletableFuture[0]));
                  }));
    }

    // find and attach to the parent nodes
    final Set<ModelLevel> parentModelLevels =
        model.getParentModelLevels(productNode.getModelLevel());
    if (parentModelLevels != null) {
      for (ModelLevel parentModelLevel : parentModelLevels) {
        futures.add(
            nodeGeneratorService
                .lookUpNode(
                    branch,
                    Long.parseLong(productNode.getConcept().getConceptId()),
                    parentModelLevel)
                .thenCompose(
                    parent -> {
                      productSummary.addEdge(
                          productNode.getConcept().getConceptId(),
                          parent.getConcept().getConceptId(),
                          IS_A_LABEL);
                      return processProductNode(
                          branch,
                          productSummary,
                          model,
                          parent,
                          packagModelLevels,
                          packageLevelNodeMap);
                    }));
      }
    }

    return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]));
  }
}
