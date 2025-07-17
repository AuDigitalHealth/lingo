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

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.gov.digitalhealth.lingo.configuration.model.BasePropertyDefinition;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.NonDefiningPropertyDefinition;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelType;
import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.product.Edge;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.OriginalNode;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.ProductDetails;
import au.gov.digitalhealth.lingo.product.details.ProductQuantity;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningBase;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty;
import au.gov.digitalhealth.lingo.util.NmpcType;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.extern.java.Log;

@Log
public abstract class ProductCalculationService<T extends ProductDetails> {
  private static String getMinusClause(Set<String> existingNodeIds) {
    return existingNodeIds.isEmpty() ? "" : "MINUS (" + String.join(" OR ", existingNodeIds) + ")";
  }

  /**
   * Calculates the existing and new products required to create a product based on the product
   * details.
   *
   * @param branch branch to lookup concepts in
   * @param packageDetails details of the product to create
   * @return ProductSummary representing the existing and new concepts required to create this
   *     product
   */
  public abstract ProductSummary calculateProductFromAtomicData(
      String branch, PackageDetails<T> packageDetails)
      throws ExecutionException, InterruptedException;

  /**
   * Asynchronously calculates the product from atomic data.
   *
   * @param branch branch to lookup concepts in
   * @param packageDetails details of the product to create
   * @return CompletableFuture containing the ProductSummary
   */
  public abstract CompletableFuture<ProductSummary> calculateProductFromAtomicDataAsync(
      String branch, PackageDetails<T> packageDetails)
      throws ExecutionException, InterruptedException;

  protected abstract SnowstormClient getSnowstormClient();

  protected abstract NodeGeneratorService getNodeGeneratorService();

  private static boolean areNodesSameProductPackageLevel(Node node, Node existingNode) {
    return (node.getModelLevel().isProductLevel() && existingNode.getModelLevel().isProductLevel())
        || (node.getModelLevel().isPackageLevel() && existingNode.getModelLevel().isPackageLevel());
  }

  protected void addPropertyChanges(
      String branch,
      List<ModelLevel> orderedLevels,
      Map<ModelLevel, CompletableFuture<Node>> levelFutureMap,
      ModelConfiguration modelConfiguration,
      ProductSummary productSummary,
      boolean isPackage,
      Node unbrandedProductNode) {
    // add other product nodes for updated properties
    Map<ModelLevelType, Set<NonDefiningBase>> propertiesToAdd = new EnumMap<>(ModelLevelType.class);
    Map<ModelLevelType, Set<NonDefiningBase>> propertiesToRemove =
        new EnumMap<>(ModelLevelType.class);

    if (unbrandedProductNode != null && unbrandedProductNode.isPropertyUpdate()) {
      // get the added properties
      Set<NonDefiningBase> addedProperties =
          new HashSet<>(unbrandedProductNode.getNonDefiningProperties());
      addedProperties.removeAll(
          unbrandedProductNode.getOriginalNode().getNode().getNonDefiningProperties());
      // get the removed properties
      Set<NonDefiningBase> removedProperties =
          new HashSet<>(
              unbrandedProductNode.getOriginalNode().getNode().getNonDefiningProperties());
      removedProperties.removeAll(unbrandedProductNode.getNonDefiningProperties());

      addedProperties.forEach(
          newProperty -> {
            BasePropertyDefinition propertyDefinition =
                modelConfiguration.getProperty(newProperty.getIdentifierScheme());
            propertyDefinition.getModelLevels().stream()
                .filter(
                    l -> orderedLevels.stream().anyMatch(ml -> ml.getModelLevelType().equals(l)))
                .forEach(
                    l -> {
                      propertiesToAdd.computeIfAbsent(l, k -> new HashSet<>()).add(newProperty);
                    });
          });
      removedProperties.forEach(
          newProperty -> {
            BasePropertyDefinition propertyDefinition =
                modelConfiguration.getProperty(newProperty.getIdentifierScheme());
            propertyDefinition.getModelLevels().stream()
                .filter(
                    l -> orderedLevels.stream().anyMatch(ml -> ml.getModelLevelType().equals(l)))
                .forEach(
                    l ->
                        propertiesToRemove
                            .computeIfAbsent(l, k -> new HashSet<>())
                            .add(newProperty));
          });
    }

    for (ModelLevel level : orderedLevels) {
      CompletableFuture<Node> levelFuture = levelFutureMap.get(level);
      Node node = levelFuture.join();
      if (node.isPropertyUpdate()) {
        Set<ModelLevelType> descendantLevels =
            level.getModelLevelType().getDescendants().stream()
                .filter(
                    l -> orderedLevels.stream().anyMatch(ml -> ml.getModelLevelType().equals(l)))
                .collect(Collectors.toSet());
        // get the added properties
        Set<NonDefiningBase> addedProperties = new HashSet<>(node.getNonDefiningProperties());
        addedProperties.removeAll(node.getOriginalNode().getNode().getNonDefiningProperties());
        // get the removed properties
        Set<NonDefiningBase> removedProperties =
            new HashSet<>(node.getOriginalNode().getNode().getNonDefiningProperties());
        removedProperties.removeAll(node.getNonDefiningProperties());

        addedProperties.forEach(
            newProperty -> {
              BasePropertyDefinition propertyDefinition =
                  modelConfiguration.getProperty(newProperty.getIdentifierScheme());
              descendantLevels.stream()
                  .filter(dl -> propertyDefinition.getModelLevels().contains(dl))
                  .forEach(
                      dl -> {
                        propertiesToAdd.computeIfAbsent(dl, k -> new HashSet<>()).add(newProperty);
                      });
            });
        removedProperties.forEach(
            newProperty -> {
              BasePropertyDefinition propertyDefinition =
                  modelConfiguration.getProperty(newProperty.getIdentifierScheme());
              descendantLevels.stream()
                  .filter(dl -> propertyDefinition.getModelLevels().contains(dl))
                  .forEach(
                      dl ->
                          propertiesToRemove
                              .computeIfAbsent(dl, k -> new HashSet<>())
                              .add(newProperty));
            });
      }
    }

    if (!propertiesToAdd.isEmpty() || !propertiesToRemove.isEmpty()) {
      Set<ModelLevelType> levelsToUpdate =
          Stream.concat(propertiesToAdd.keySet().stream(), propertiesToRemove.keySet().stream())
              .collect(Collectors.toSet());
      Set<String> existingNodeIds =
          productSummary.getNodes().stream()
              .filter(node -> !node.isNewConcept())
              .map(Node::getConceptId)
              .collect(Collectors.toSet());
      Set<CompletableFuture<Node>> futures = new HashSet<>();
      Map<Node, Node> addedToExistingNodeMap = new HashMap<>();
      for (ModelLevelType levelType : levelsToUpdate) {
        // get concept
        final ModelLevel modelLevel = modelConfiguration.getLevelOfType(levelType);
        final Node existingNode = levelFutureMap.get(modelLevel).join();
        if (existingNode.isNewConcept()) {
          continue;
        }

        final String ecl =
            unbrandedProductNode == null
                ? "(<"
                    + existingNode.getConceptId()
                    + " AND ^"
                    + modelLevel.getReferenceSetIdentifier()
                    + ") "
                    + getMinusClause(existingNodeIds)
                : "(<<(<(781405001 or 999000071000168104):(774160008 or 999000081000168101)="
                    + unbrandedProductNode.getConceptId()
                    + ") AND ^"
                    + modelLevel.getReferenceSetIdentifier()
                    + ") "
                    + getMinusClause(existingNodeIds);
        Collection<SnowstormConceptMini> concepts =
            getSnowstormClient()
                .getConceptsFromEcl(branch, ecl, 100, modelConfiguration.isExecuteEclAsStated());

        for (SnowstormConceptMini concept : concepts) {
          // get the node for the level type
          // add and remove the properties
          futures.add(
              getNodeGeneratorService()
                  .lookUpNode(branch, concept, modelLevel)
                  .thenApply(
                      node -> {
                        node.setOriginalNode(new OriginalNode(node.cloneNode(), null, true));
                        if (!propertiesToAdd.containsKey(levelType)
                            && !propertiesToRemove.containsKey(levelType)) {
                          throw new LingoProblem(
                              "No properties to add or remove for level type: " + levelType);
                        }
                        if (propertiesToAdd.containsKey(levelType)) {
                          node.getNonDefiningProperties().addAll(propertiesToAdd.get(levelType));
                        }
                        if (propertiesToRemove.containsKey(levelType)) {
                          node.getNonDefiningProperties()
                              .removeAll(propertiesToRemove.get(levelType));
                        }
                        addedToExistingNodeMap.put(node, existingNode);
                        return node;
                      }));
        }
      }
      CompletableFuture.allOf(futures.toArray(new CompletableFuture[futures.size()])).join();
      for (CompletableFuture<Node> future : futures) {
        Node node = future.join();
        if (node.getConceptId() == null) {
          throw new LingoProblem(
              "Node with null concept id found for level type: " + node.getModelLevel());
        }
        // if the node is already in the product summary, skip it
        if (productSummary.getNodes().stream()
            .noneMatch(
                existingNode ->
                    existingNode.getConceptId() == node.getConceptId()
                        || (existingNode.getOriginalNode() != null
                            && existingNode.getOriginalNode().getConceptId()
                                == node.getConceptId()))) {
          productSummary.addNode(node);
          final Node existingNode = addedToExistingNodeMap.get(node);
          productSummary.addEdge(
              node.getConceptId(),
              existingNode.getConceptId(),
              areNodesSameProductPackageLevel(node, existingNode)
                  ? ProductSummaryService.IS_A_LABEL
                  : ProductSummaryService.CONTAINS_LABEL);
        }
      }
    }
  }

  protected void addPropertyChangeNodes(
      String branch,
      ModelConfiguration modelConfiguration,
      Map<ProductQuantity<T>, ProductSummary> innnerProductSummaries,
      ProductSummary productSummary,
      Set<ModelLevel> packageLevels,
      Map<ModelLevel, CompletableFuture<Node>> packageLevelFutures) {
    for (ProductSummary innerProductSummary : innnerProductSummaries.values()) {
      Node subject = innerProductSummary.getSingleSubject();

      Set<Edge> transitiveContainsEdges =
          ProductSummaryService.getTransitiveEdges(innerProductSummary, new HashSet<>());
      innerProductSummary.getEdges().addAll(transitiveContainsEdges);
      Set<Node> containedUnbrandedProduct =
          innerProductSummary.getNodes().stream()
              .filter(
                  n ->
                      n.getModelLevel()
                              .equals(
                                  modelConfiguration
                                      .getLeafUnbrandedProductModelLevel()
                                      .getModelLevelType())
                          && innerProductSummary.getEdges().stream()
                              .anyMatch(
                                  e ->
                                      e.getSource().equals(subject.getConceptId())
                                          && e.getTarget().equals(n.getConceptId())))
              .collect(Collectors.toSet());
      if (containedUnbrandedProduct.isEmpty()) {
        throw new LingoProblem("No unbranded product found for inner product summary");
      }
      if (containedUnbrandedProduct.size() > 1) {
        throw new LingoProblem(
            "More than one unbranded product found for inner product summary: "
                + containedUnbrandedProduct);
      }

      addPropertyChanges(
          branch,
          new ArrayList<>(packageLevels),
          packageLevelFutures,
          modelConfiguration,
          productSummary,
          true,
          containedUnbrandedProduct.iterator().next());
    }
  }

  protected void optionallyAddNmpcType(
      String branch, ModelConfiguration modelConfiguration, PackageDetails<T> packageDetails) {
    if (modelConfiguration.getModelType().equals(ModelType.NMPC)) {
      NonDefiningPropertyDefinition nmpcDefinition =
          modelConfiguration.getNonDefiningPropertiesByName().get("nmpcType");
      if (nmpcDefinition != null && requiredNmpcTypeConceptsExist(branch, nmpcDefinition)) {
        NonDefiningProperty nmpcType = new NonDefiningProperty();
        nmpcType.setIdentifierScheme(nmpcDefinition.getName());
        nmpcType.setIdentifier(nmpcDefinition.getIdentifier());
        nmpcType.setTitle(nmpcDefinition.getTitle());
        nmpcType.setDescription(nmpcDefinition.getDescription());

        nmpcType.setValueObject(packageDetails.getNmpcType().snowstormConceptMini());

        packageDetails
            .getContainedPackages()
            .forEach(
                innerPackage ->
                    innerPackage
                        .getPackageDetails()
                        .getContainedProducts()
                        .forEach(
                            innerProduct ->
                                innerProduct
                                    .getProductDetails()
                                    .getNonDefiningProperties()
                                    .add(nmpcType)));
        packageDetails
            .getContainedProducts()
            .forEach(
                innerProduct ->
                    innerProduct.getProductDetails().getNonDefiningProperties().add(nmpcType));

        packageDetails.getNonDefiningProperties().add(nmpcType);
      } else {
        log.severe("NMPC model type is configured but the required concepts do not exist.");
      }
    }
  }

  private boolean requiredNmpcTypeConceptsExist(
      String branch, NonDefiningPropertyDefinition nmpcDefinition) {
    Set<String> nmpcConcepts =
        new HashSet<>(Collections.singletonList(nmpcDefinition.getIdentifier()));
    nmpcConcepts.addAll(
        Arrays.stream(NmpcType.values()).map(t -> t.getValue()).collect(Collectors.toSet()));
    return getSnowstormClient().conceptIdsThatExist(branch, nmpcConcepts).containsAll(nmpcConcepts);
  }
}
