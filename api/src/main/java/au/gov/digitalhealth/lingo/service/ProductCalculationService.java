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
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.NonDefiningPropertyDefinition;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelType;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.Edge;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.OriginalNode;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.ProductDetails;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningBase;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty;
import au.gov.digitalhealth.lingo.service.validators.ValidationResult;
import au.gov.digitalhealth.lingo.util.NmpcType;
import au.gov.digitalhealth.lingo.validation.AuthoringValidation;
import jakarta.validation.Valid;
import jakarta.validation.groups.Default;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.extern.java.Log;
import org.springframework.validation.annotation.Validated;

@Log
@Validated({AuthoringValidation.class, Default.class})
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
      String branch, @Valid PackageDetails<@Valid T> packageDetails)
      throws ExecutionException, InterruptedException;

  /**
   * Validates the atomic data of a product, ensuring that all required fields are present and
   * correctly formatted. This method does not perform any calculations or modifications to the
   * product data. It is intended to be used for validation purposes only.
   *
   * @param branch branch to lookup concepts in
   * @param productDetails details of the product to validate
   */
  public abstract ValidationResult validateProductAtomicData(
      String branch, @Valid PackageDetails<@Valid T> productDetails)
      throws ProductAtomicDataValidationProblem;

  /**
   * Asynchronously calculates the product from atomic data.
   *
   * @param branch branch to lookup concepts in
   * @param packageDetails details of the product to create
   * @return CompletableFuture containing the ProductSummary
   */
  public abstract CompletableFuture<ProductSummary> calculateProductFromAtomicDataAsync(
      String branch, @Valid PackageDetails<@Valid T> packageDetails)
      throws ExecutionException, InterruptedException;

  protected abstract SnowstormClient getSnowstormClient();

  protected abstract NodeGeneratorService getNodeGeneratorService();

  private static boolean areNodesSameProductPackageLevel(Node node, Node existingNode) {
    return (node.getModelLevel().isProductLevel() && existingNode.getModelLevel().isProductLevel())
        || (node.getModelLevel().isPackageLevel() && existingNode.getModelLevel().isPackageLevel());
  }

  private static boolean updateProperties(
      ModelConfiguration modelConfiguration,
      ModelLevel level,
      Node subordinateNode,
      Set<NonDefiningBase> addedProperties,
      Set<NonDefiningBase> removedProperties) {
    boolean updated = false;
    // add the properties to the node
    if (!addedProperties.isEmpty()) {
      updated =
          subordinateNode
              .getNonDefiningProperties()
              .addAll(
                  addedProperties.stream()
                      .filter(
                          p ->
                              !p.getIdentifierScheme().equals("levelMarker")
                                  && !p.getIdentifierScheme().equals("nmpcType"))
                      .filter(
                          p ->
                              modelConfiguration
                                  .getProperty(p.getIdentifierScheme())
                                  .getModelLevels()
                                  .contains(level.getModelLevelType()))
                      .collect(Collectors.toSet()));
    }
    if (!removedProperties.isEmpty()) {
      updated =
          updated
              || subordinateNode
                  .getNonDefiningProperties()
                  .removeAll(
                      removedProperties.stream()
                          .filter(
                              p ->
                                  !p.getIdentifierScheme().equals("levelMarker")
                                      && !p.getIdentifierScheme().equals("nmpcType"))
                          .filter(
                              p ->
                                  modelConfiguration
                                      .getProperty(p.getIdentifierScheme())
                                      .getModelLevels()
                                      .contains(level.getModelLevelType()))
                          .collect(Collectors.toSet()));
    }
    return updated;
  }

  protected void addPropertyChangeNodes(
      String branch, ModelConfiguration modelConfiguration, ProductSummary productSummary) {
    Map<String, Node> nodeCache = new HashMap<>();
    Set<Node> nodesToAdd = new HashSet<>();
    Set<Edge> edgesToAdd = new HashSet<>();

    // for each node in the product summary that is a property update
    for (Node node : productSummary.getNodes().stream().filter(Node::isPropertyUpdate).toList()) {
      // find the property changes for the node
      Set<NonDefiningBase> addedProperties = new HashSet<>(node.getNonDefiningProperties());
      addedProperties.removeAll(
          node.getOriginalNode().getNode().getNonDefiningProperties().stream()
              .filter(
                  p ->
                      !p.getIdentifierScheme().equals("levelMarker")
                          && !p.getIdentifierScheme().equals("nmpcType"))
              .toList());
      Set<NonDefiningBase> removedProperties =
          new HashSet<>(
              node.getOriginalNode().getNode().getNonDefiningProperties().stream()
                  .filter(
                      p ->
                          !p.getIdentifierScheme().equals("levelMarker")
                              && !p.getIdentifierScheme().equals("nmpcType"))
                  .toList());
      removedProperties.removeAll(node.getNonDefiningProperties());

      Set<ModelLevel> levels =
          Stream.concat(addedProperties.stream(), removedProperties.stream())
              .filter(
                  p ->
                      !p.getIdentifierScheme().equals("levelMarker")
                          && !p.getIdentifierScheme().equals("nmpcType"))
              .map(modelConfiguration::getApplicablePropertyLevels)
              .flatMap(Collection::stream)
              .collect(Collectors.toSet());

      for (ModelLevel level : levels) {
        final Collection<SnowstormConceptMini> subordinateLinkedConcepts =
            findSubordinateLinkedConcepts(branch, modelConfiguration, productSummary, node, level);

        for (SnowstormConceptMini linkedConcept : subordinateLinkedConcepts) {
          Node subordinateNode = nodeCache.get(linkedConcept.getConceptId());
          if (subordinateNode == null) {
            // if the node is not in the cache, create a new node
            subordinateNode =
                getNodeGeneratorService().lookUpNode(branch, linkedConcept, level, null).join();
            subordinateNode.setOriginalNode(
                new OriginalNode(subordinateNode.cloneNode(), null, true));
            nodeCache.put(linkedConcept.getConceptId(), subordinateNode);
          }

          final boolean updated =
              updateProperties(
                  modelConfiguration, level, subordinateNode, addedProperties, removedProperties);

          if (updated) {
            nodesToAdd.add(subordinateNode);
            Edge edge = new Edge();
            edge.setSource(subordinateNode.getConceptId());
            edge.setTarget(node.getConceptId());
            edge.setLabel(
                areNodesSameProductPackageLevel(node, subordinateNode)
                    ? ProductSummaryService.IS_A_LABEL
                    : ProductSummaryService.CONTAINS_LABEL);
            edgesToAdd.add(edge);
          }
        }
      }
    }
    // add the nodes and edges to the product summary
    productSummary.getNodes().addAll(nodesToAdd);
    productSummary.getEdges().addAll(edgesToAdd);
  }

  private Collection<SnowstormConceptMini> findSubordinateLinkedConcepts(
      String branch,
      ModelConfiguration modelConfiguration,
      ProductSummary productSummary,
      Node node,
      ModelLevel level) {
    return getSnowstormClient()
        .getConceptsFromEcl(
            branch,
            "(((<"
                + node.getConceptId()
                + " AND ^"
                + level.getReferenceSetIdentifier()
                + ") OR (<<(<(781405001 or 999000071000168104):(774160008 or 999000081000168101)=<<"
                + node.getConceptId()
                + "))) AND ^"
                + level.getReferenceSetIdentifier()
                + ") "
                + getMinusClause(
                    productSummary.getNodes().stream()
                        .filter(n -> !n.isNewConcept())
                        .map(Node::getConceptId)
                        .collect(Collectors.toSet())),
            100,
            modelConfiguration.isExecuteEclAsStated());
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
                innerPackage -> {
                  innerPackage
                      .getPackageDetails()
                      .getContainedProducts()
                      .forEach(
                          innerProduct ->
                              innerProduct
                                  .getProductDetails()
                                  .getNonDefiningProperties()
                                  .add(nmpcType));
                  innerPackage.getPackageDetails().getNonDefiningProperties().add(nmpcType);
                });
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
