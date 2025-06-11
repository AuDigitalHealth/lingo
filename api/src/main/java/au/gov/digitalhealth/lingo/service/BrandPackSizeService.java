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

import static au.gov.digitalhealth.lingo.service.ProductSummaryService.CONTAINS_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.HAS_PRODUCT_NAME_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.IS_A_LABEL;
import static au.gov.digitalhealth.lingo.util.AmtConstants.CONTAINS_DEVICE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_DEVICE_TYPE;
import static au.gov.digitalhealth.lingo.util.NonDefiningPropertiesConverter.calculateNonDefiningRelationships;
import static au.gov.digitalhealth.lingo.util.ReferenceSetUtils.getReferenceSetMembers;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CONTAINS_CD;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRODUCT_NAME;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.IS_A;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MEDICINAL_PRODUCT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.STATED_RELATIONSHUIP_CHARACTRISTIC_TYPE;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.cloneNewRelationships;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleActiveBigDecimal;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleActiveTarget;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleAxiom;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleOptionalActiveTarget;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSnowstormRelationship;
import static au.gov.digitalhealth.lingo.util.ValidationUtil.assertSingleComponentSinglePackProduct;

import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelType;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.BrandWithIdentifiers;
import au.gov.digitalhealth.lingo.product.Edge;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.PackSizeWithIdentifiers;
import au.gov.digitalhealth.lingo.product.ProductBrands;
import au.gov.digitalhealth.lingo.product.ProductPackSizes;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.bulk.BrandPackSizeCreationDetails;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningBase;
import au.gov.digitalhealth.lingo.util.AmtConstants;
import au.gov.digitalhealth.lingo.util.BigDecimalFormatter;
import au.gov.digitalhealth.lingo.util.RelationshipSorter;
import au.gov.digitalhealth.lingo.util.SnomedConstants;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.*;
import java.util.Map.Entry;
import java.util.concurrent.CompletableFuture;
import java.util.logging.Level;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Log
public class BrandPackSizeService {

  private final ProductSummaryService productSummaryService;
  private final SnowstormClient snowstormClient;
  private final NameGenerationService nameGenerationService;
  private final NodeGeneratorService nodeGeneratorService;
  private final Models models;

  @Value("${snomio.decimal-scale}")
  int decimalScale;

  @Autowired
  public BrandPackSizeService(
      SnowstormClient snowstormClient,
      NameGenerationService nameGenerationService,
      NodeGeneratorService nodeGeneratorService,
      ProductSummaryService productSummaryService,
      Models models) {
    this.snowstormClient = snowstormClient;
    this.nameGenerationService = nameGenerationService;
    this.nodeGeneratorService = nodeGeneratorService;
    this.productSummaryService = productSummaryService;
    this.models = models;
  }

  private static void validateUnitOfMeasure(
      BrandPackSizeCreationDetails brandPackSizeCreationDetails,
      SnowstormConcept leafPackageConcept) {
    String ctppUnitOfMeasure =
        getSingleActiveTarget(
                getSingleAxiom(leafPackageConcept).getRelationships(),
                HAS_PACK_SIZE_UNIT.getValue())
            .getConceptId();

    assert ctppUnitOfMeasure != null;
    if (!ctppUnitOfMeasure.equals(
        brandPackSizeCreationDetails.getPackSizes().getUnitOfMeasure().getConceptId())) {
      throw new ProductAtomicDataValidationProblem(
          "The selected product must have the same pack size unit of measure. The new product has a unit of measure of "
              + ctppUnitOfMeasure
              + " and the selected product has a unit of measure of "
              + brandPackSizeCreationDetails.getPackSizes().getUnitOfMeasure().getConceptId());
    }
  }

  private static SnowstormConceptMini validateSingleBrand(
      SnowstormConcept leafPackageConcept,
      SnowstormConcept leafProductConcept,
      ModelConfiguration modelConfiguration) {

    SnowstormConceptMini leafProductBrand =
        getSingleActiveTarget(
            getSingleAxiom(leafProductConcept).getRelationships(), HAS_PRODUCT_NAME.getValue());

    if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
      SnowstormConceptMini leafPackageBrand =
          getSingleActiveTarget(
              getSingleAxiom(leafPackageConcept).getRelationships(), HAS_PRODUCT_NAME.getValue());

      if (!Objects.equals(leafPackageBrand.getConceptId(), leafProductBrand.getConceptId())) {
        throw new ProductAtomicDataValidationProblem(
            "The brand of the package and product must be the same. Brands were "
                + leafPackageBrand.getConceptId()
                + " and "
                + leafProductBrand.getConceptId());
      }
    }

    return leafProductBrand;
  }

  private static Set<SnowstormRelationship> calculateNewBrandedPackRelationships(
      BigDecimal packSize,
      int decimalScale,
      SnowstormConcept tppConcept,
      SnowstormConceptMini brand,
      Node newTpuuNode,
      AtomicCache atomicCache,
      ModelConfiguration modelConfiguration) {
    Set<SnowstormRelationship> newRelationships =
        cloneNewRelationships(
            tppConcept.getClassAxioms().iterator().next().getRelationships(),
            modelConfiguration.getModuleId());

    for (SnowstormRelationship relationship : newRelationships) {
      relationship.setConcrete(relationship.getConcreteValue() != null);
      relationship.setCharacteristicTypeId(STATED_RELATIONSHUIP_CHARACTRISTIC_TYPE.getValue());
      if (relationship.getTypeId().equals(HAS_PACK_SIZE_VALUE.getValue())) {
        String packSizeString =
            BigDecimalFormatter.formatBigDecimal(
                packSize, decimalScale, modelConfiguration.isTrimWholeNumbers());
        Objects.requireNonNull(relationship.getConcreteValue()).setValue(packSizeString);
        Objects.requireNonNull(relationship.getConcreteValue())
            .setValueWithPrefix("#" + packSizeString);
        relationship.setConcrete(true);
      }
      if (relationship.getTypeId().equals(HAS_PRODUCT_NAME.getValue())) {
        relationship.setDestinationId(brand.getConceptId());
        relationship.setTarget(brand);
      }
      if (newTpuuNode != null && relationship.getTypeId().equals(CONTAINS_CD.getValue())) {
        relationship.setDestinationId(newTpuuNode.getConceptId());
        relationship.setTarget(SnowstormDtoUtil.toSnowstormConceptMini(newTpuuNode));
      }
    }

    newRelationships =
        newRelationships.stream()
            .filter(r -> !r.getTypeId().equals(IS_A.getValue()))
            .collect(Collectors.toSet());

    newRelationships.forEach(
        r -> {
          if (!Boolean.TRUE.equals(r.getConcrete()) && r.getTarget() != null) {
            atomicCache.addFsn(r.getDestinationId(), r.getTarget().getFsn().getTerm());
          }
        });

    return newRelationships;
  }

  private static void addParent(Node child, Node parent, String moduleId) {
    if (child.isNewConcept()) {
      child
          .getNewConceptDetails()
          .getAxioms()
          .forEach(
              a -> a.getRelationships().add(getSnowstormRelationship(IS_A, parent, 0, moduleId)));
    }
  }

  private static Node getGenericPackageNode(
      Map<Pair<BigDecimal, ModelLevelType>, Set<CompletableFuture<Node>>> genericPackageFutureMap,
      @NotNull BigDecimal packSize,
      ModelConfiguration modelConfiguration) {
    Set<CompletableFuture<Node>> newMppNodes =
        genericPackageFutureMap.get(
            Pair.of(
                packSize,
                modelConfiguration.getLeafUnbrandedPackageModelLevel().getModelLevelType()));
    if (newMppNodes == null || newMppNodes.isEmpty()) {
      throw new ProductAtomicDataValidationProblem(
          "No leaf generic package node found for pack size " + packSize);
    } else if (newMppNodes.size() > 1) {
      throw new ProductAtomicDataValidationProblem(
          "Multiple leaf generic package nodes found for pack size " + packSize);
    }
    return newMppNodes.iterator().next().join();
  }

  private static Node getBrandedProductNode(
      Map<Pair<String, ModelLevelType>, Set<CompletableFuture<Node>>> brandedProductFutureMap,
      SnowstormConceptMini brand,
      ModelLevelType level) {
    Set<CompletableFuture<Node>> nodes =
        brandedProductFutureMap.get(Pair.of(brand.getConceptId(), level));
    if (nodes == null || nodes.isEmpty()) {
      throw new ProductAtomicDataValidationProblem(
          "No leaf branded product node found for brand " + brand.getConceptId());
    } else if (nodes.size() > 1) {
      throw new ProductAtomicDataValidationProblem(
          "Multiple leaf branded product nodes found for brand " + brand.getConceptId());
    }
    return nodes.iterator().next().join();
  }

  private void addEdgesAndNodes(
      ProductSummary productSummary,
      SnowstormConceptMini brand,
      Node newBrandedProductLeafNode,
      Node newGenericPackageLeafNode,
      Map<ModelLevelType, CompletableFuture<Node>> newBrandedPackageNodeFutures,
      Map<Pair<String, ModelLevelType>, Set<CompletableFuture<Node>>> brandedProductFutureMap,
      Node leafUnbrandedProductNode,
      ModelConfiguration modelConfiguration) {

    Node productName = null;

    if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
      ModelLevel productNameLevel = modelConfiguration.getLevelOfType(ModelLevelType.PRODUCT_NAME);
      productName = productSummary.getNode(brand.getConceptId());
      if (productName == null) {
        productName = new Node(brand, productNameLevel);
        productSummary.addNode(productName);
      }
    }

    if (newGenericPackageLeafNode != null) {
      productSummary.addNode(newGenericPackageLeafNode);
      productSummary.addEdge(
          newGenericPackageLeafNode.getConceptId(),
          leafUnbrandedProductNode.getConceptId(),
          CONTAINS_LABEL);
    }

    Map<ModelLevelType, CompletableFuture<Node>> newBrandedProductMap =
        new EnumMap<>(ModelLevelType.class);
    for (Entry<Pair<String, ModelLevelType>, Set<CompletableFuture<Node>>> entry :
        brandedProductFutureMap.entrySet()) {
      if (entry.getKey().getLeft().equals(brand.getConceptId())) {
        Set<CompletableFuture<Node>> nodes = entry.getValue();
        if (nodes == null || nodes.isEmpty()) {
          throw new ProductAtomicDataValidationProblem(
              "No branded product node found for brand " + brand.getConceptId());
        } else if (nodes.size() > 1) {
          throw new ProductAtomicDataValidationProblem(
              "Multiple branded product nodes found for brand " + brand.getConceptId());
        }
        newBrandedProductMap.put(entry.getKey().getRight(), nodes.iterator().next());
      }
    }

    for (CompletableFuture<Node> futureNode :
        brandedProductFutureMap.entrySet().stream()
            .filter(entry -> entry.getKey().getLeft().equals(brand.getConceptId()))
            .flatMap(entry -> entry.getValue().stream())
            .collect(Collectors.toSet())) {
      Node newBrandedProductNode = futureNode.join();
      productSummary.addNode(newBrandedProductNode);
      if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
        productSummary.addEdge(
            newBrandedProductNode.getConceptId(),
            productName.getConceptId(),
            HAS_PRODUCT_NAME_LABEL);
      }
      if (newBrandedProductNode.getModelLevel().equals(newBrandedProductLeafNode.getModelLevel())) {
        productSummary.addEdge(
            newBrandedProductNode.getConceptId(),
            leafUnbrandedProductNode.getConceptId(),
            IS_A_LABEL);
        addParent(
            newBrandedProductNode, leafUnbrandedProductNode, modelConfiguration.getModuleId());
      }

      modelConfiguration.getAncestorModelLevels(newBrandedProductNode.getModelLevel()).stream()
          .filter(ModelLevel::isBranded)
          .forEach(
              ancestorModelLevel -> {
                Node ancestorNode =
                    newBrandedProductMap.get(ancestorModelLevel.getModelLevelType()).join();
                productSummary.addEdge(
                    newBrandedProductNode.getConceptId(), ancestorNode.getConceptId(), IS_A_LABEL);
                addParent(newBrandedProductNode, ancestorNode, modelConfiguration.getModuleId());
              });
    }

    for (CompletableFuture<Node> future : newBrandedPackageNodeFutures.values()) {
      Node newBrandedPackageNode = future.join();
      productSummary.addNode(newBrandedPackageNode);
      productSummary.addEdge(
          newBrandedPackageNode.getConceptId(),
          newBrandedProductLeafNode.getConceptId(),
          CONTAINS_LABEL);
      if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
        productSummary.addEdge(
            newBrandedPackageNode.getConceptId(),
            productName.getConceptId(),
            HAS_PRODUCT_NAME_LABEL);
      }
      modelConfiguration.getAncestorModelLevels(newBrandedPackageNode.getModelLevel()).stream()
          .filter(ModelLevel::isBranded)
          .forEach(
              ancestorLevel -> {
                Node ancestorNode =
                    newBrandedPackageNodeFutures.get(ancestorLevel.getModelLevelType()).join();
                productSummary.addEdge(
                    newBrandedPackageNode.getConceptId(), ancestorNode.getConceptId(), IS_A_LABEL);
                addParent(newBrandedPackageNode, ancestorNode, modelConfiguration.getModuleId());
              });

      if (modelConfiguration.getAncestorModelLevels(newBrandedPackageNode.getModelLevel()).stream()
          .noneMatch(ModelLevel::isBranded)) {
        productSummary.addEdge(
            newBrandedPackageNode.getConceptId(),
            newGenericPackageLeafNode.getConceptId(),
            IS_A_LABEL);
        addParent(
            newBrandedPackageNode, newGenericPackageLeafNode, modelConfiguration.getModuleId());
      }
    }
  }

  /**
   * Calculates the new brand pack sizes required to create a product based on the brand pack size
   * details.
   *
   * @param branch branch to lookup concepts in
   * @param brandPackSizeCreationDetails details of the brand pack sizes to create
   * @return ProductSummary representing the existing and new concepts required to create this
   *     product
   */
  public ProductSummary calculateNewBrandPackSizes(
      String branch, BrandPackSizeCreationDetails brandPackSizeCreationDetails) {

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    ProductBrands brands = brandPackSizeCreationDetails.getBrands();
    ProductPackSizes packSizes = brandPackSizeCreationDetails.getPackSizes();

    if ((packSizes == null || packSizes.getPackSizes().isEmpty())
        && (brands == null || brands.getBrands().isEmpty())) {
      throw new ProductAtomicDataValidationProblem("No pack sizes or brands provided");
    }

    ProductSummary productSummary =
        productSummaryService.getProductSummary(
            branch, brandPackSizeCreationDetails.getProductId());

    AtomicCache atomicCache =
        new AtomicCache(
            brandPackSizeCreationDetails.getIdFsnMap(),
            AmtConstants.values(),
            SnomedConstants.values());

    Map<ModelLevelType, Node> brandedPackageNodeMap =
        productSummary.getNodes().stream()
            .filter(n -> n.getModelLevel().isPackageLevel())
            .filter(n -> n.getModelLevel().isBranded())
            .collect(Collectors.toMap(Node::getModelLevel, n -> n));

    Map<ModelLevelType, Node> brandedProductNodeMap =
        productSummary.getNodes().stream()
            .filter(n -> n.getModelLevel().isProductLevel())
            .filter(n -> n.getModelLevel().isBranded())
            .collect(Collectors.toMap(Node::getModelLevel, n -> n));

    Map<ModelLevelType, Node> genericPackageNodeMap =
        productSummary.getNodes().stream()
            .filter(n -> n.getModelLevel().isPackageLevel())
            .filter(n -> !n.getModelLevel().isBranded())
            .collect(Collectors.toMap(Node::getModelLevel, n -> n));

    Map<ModelLevelType, Node> genericProductNodeMap =
        productSummary.getNodes().stream()
            .filter(n -> n.getModelLevel().isProductLevel())
            .filter(n -> !n.getModelLevel().isBranded())
            .collect(Collectors.toMap(Node::getModelLevel, n -> n));

    Map<String, SnowstormConcept> concepts =
        snowstormClient
            .getBrowserConcepts(
                branch, productSummary.getNodes().stream().map(Node::getConceptId).toList())
            .collectMap(SnowstormConcept::getConceptId, c -> c)
            .block();

    assert concepts != null;

    Node leafBrandedPackageNode =
        brandedPackageNodeMap.get(
            modelConfiguration.getLeafPackageModelLevel().getModelLevelType());
    Node leafBrandedProductNode =
        brandedProductNodeMap.get(
            modelConfiguration.getLeafProductModelLevel().getModelLevelType());
    Node leafUnbrandedPackageNode =
        genericPackageNodeMap.get(
            modelConfiguration.getLeafUnbrandedPackageModelLevel().getModelLevelType());
    Node leafUnbrandedProductNode =
        genericProductNodeMap.get(
            modelConfiguration.getLeafUnbrandedProductModelLevel().getModelLevelType());

    final SnowstormConcept leafPackageConcept = concepts.get(leafBrandedPackageNode.getConceptId());
    final SnowstormConcept leafProductConcept = concepts.get(leafBrandedProductNode.getConceptId());

    assertSingleComponentSinglePackProduct(leafPackageConcept);

    SnowstormConceptMini selectedProductBrand =
        validateSingleBrand(leafPackageConcept, leafProductConcept, modelConfiguration);

    if (packSizes != null) {
      validateUnitOfMeasure(brandPackSizeCreationDetails, leafPackageConcept);
    }

    BigDecimal leafPackSizeValue =
        getSingleActiveBigDecimal(
            getSingleAxiom(leafPackageConcept).getRelationships(), HAS_PACK_SIZE_VALUE.getValue());

    PackSizeWithIdentifiers leafPackSize = new PackSizeWithIdentifiers();
    leafPackSize.setPackSize(leafPackSizeValue);

    boolean isDevice =
        getSingleOptionalActiveTarget(
                getSingleAxiom(leafPackageConcept).getRelationships(), HAS_DEVICE_TYPE.getValue())
            != null;

    if ((packSizes == null
            || (packSizes.getPackSizes().size() == 1
                && packSizes
                    .getPackSizes()
                    .iterator()
                    .next()
                    .getPackSize()
                    .equals(leafPackSize.getPackSize())))
        && (brands == null
            || (brands.getBrands().size() == 1
                && brands
                    .getBrands()
                    .iterator()
                    .next()
                    .getBrand()
                    .getConceptId()
                    .equals(selectedProductBrand.getConceptId())))) {

      // todo not sure what this is necessary as there should be no new concepts
      productSummary.getNodes().stream()
          .filter(Node::isNewConcept)
          .forEach(
              n ->
                  n.getNewConceptDetails()
                      .getAxioms()
                      .forEach(RelationshipSorter::sortRelationships));

      // no new concepts required
      return productSummary;
    }

    // get the CTPP, TPP, MPP and TPUU concepts and generate new concepts one per brand/pack
    // combination
    Map<Pair<String, ModelLevelType>, Set<CompletableFuture<Node>>> brandedProductFutureMap =
        new HashMap<>();
    if (brands != null) {
      for (BrandWithIdentifiers brandPackSizeEntry : brands.getBrands()) {
        SnowstormConceptMini brand = brandPackSizeEntry.getBrand();

        brandedProductNodeMap.forEach(
            (type, node) -> {
              if (!brand.getConceptId().equals(selectedProductBrand.getConceptId())) {
                log.fine("Creating new branded product node of type " + type);
                brandedProductFutureMap
                    .computeIfAbsent(
                        Pair.of(brand.getConceptId(), node.getModelLevel()),
                        k -> Collections.synchronizedSet(new HashSet<>()))
                    .add(
                        createNewBrandedProductNode(
                                branch,
                                concepts.get(node.getConceptId()),
                                brand,
                                atomicCache,
                                brandPackSizeEntry.getNonDefiningProperties(),
                                isDevice,
                                node.getModelLevel())
                            .thenApply(
                                n -> {
                                  atomicCache.addFsn(n.getConceptId(), n.getFullySpecifiedName());
                                  return n;
                                }));
              } else {
                log.fine("Reusing existing " + type + " node");
                atomicCache.addFsn(node.getConceptId(), node.getFullySpecifiedName());
              }
            });
      }
    }

    Map<Pair<BigDecimal, ModelLevelType>, Set<CompletableFuture<Node>>> genericPackageFutureMap =
        new HashMap<>();
    if (packSizes != null) {
      for (PackSizeWithIdentifiers packSize : packSizes.getPackSizes()) {
        genericPackageNodeMap.forEach(
            (type, node) -> {
              if (!packSize.getPackSize().equals(leafPackSize.getPackSize())) {
                log.fine("Creating new MPP node");
                genericPackageFutureMap
                    .computeIfAbsent(
                        Pair.of(packSize.getPackSize(), node.getModelLevel()),
                        k -> Collections.synchronizedSet(new HashSet<>()))
                    .add(
                        createNewGenericPackageNode(
                                branch,
                                packSize.getPackSize(),
                                concepts.get(node.getConceptId()),
                                atomicCache,
                                packSize.getNonDefiningProperties(),
                                isDevice,
                                node.getModelLevel())
                            .thenApply(
                                m -> {
                                  atomicCache.addFsn(m.getConceptId(), m.getFullySpecifiedName());
                                  return m;
                                }));
              } else {
                atomicCache.addFsn(node.getConceptId(), node.getFullySpecifiedName());
                log.fine("Reusing existing MPP node");
              }
            });
      }
    }

    if (brands != null
        && brands.getBrands().stream()
            .collect(Collectors.groupingBy(BrandWithIdentifiers::getBrand))
            .values()
            .stream()
            .anyMatch(l -> l.size() > 1)) {
      throw new ProductAtomicDataValidationProblem(
          "Duplicate brands found in the provided brand list. Please ensure each brand is unique.");
    }

    Set<BrandWithIdentifiers> brandSet =
        brands == null
            ? Set.of(BrandWithIdentifiers.builder().brand(selectedProductBrand).build())
            : brands.getBrands();

    List<CompletableFuture<ProductSummary>> productSummaryFutures = new ArrayList<>();

    Set<PackSizeWithIdentifiers> packSizesToProcess =
        packSizes == null ? Set.of(leafPackSize) : packSizes.getPackSizes();

    for (BrandWithIdentifiers brandPackSize : brandSet) {
      SnowstormConceptMini brand = brandPackSize.getBrand();
      for (PackSizeWithIdentifiers packSize : packSizesToProcess) {
        final boolean newBrand = !brand.getConceptId().equals(selectedProductBrand.getConceptId());
        final boolean newPackSize = !packSize.getPackSize().equals(leafPackSize.getPackSize());
        if (newBrand || newPackSize) {
          if (log.isLoggable(Level.FINE)) {
            log.fine(
                "Creating new brand pack size for brand "
                    + brand.getConceptId()
                    + " and pack size "
                    + packSize);
          }
          final Node newBrandedProductLeafNode =
              newBrand
                  ? getBrandedProductNode(
                      brandedProductFutureMap, brand, leafBrandedProductNode.getModelLevel())
                  : leafBrandedProductNode;
          final Node newGenericPackageLeafNode =
              newPackSize
                  ? getGenericPackageNode(
                      genericPackageFutureMap, packSize.getPackSize(), modelConfiguration)
                  : leafUnbrandedPackageNode;

          Set<NonDefiningBase> unionOfBrandAndPackNonDefiningProperties =
              new HashSet<>(packSize.getNonDefiningProperties());
          unionOfBrandAndPackNonDefiningProperties.addAll(brandPackSize.getNonDefiningProperties());

          Map<ModelLevelType, CompletableFuture<Node>> newBrandedPackageNodeFutures =
              new EnumMap<>(ModelLevelType.class);
          brandedPackageNodeMap.forEach(
              (type, node) -> {
                if (log.isLoggable(Level.FINE)) {
                  log.fine("Creating new branded package node of type " + type);
                }
                newBrandedPackageNodeFutures.put(
                    type,
                    createNewBrandedPackageNode(
                        branch,
                        packSize.getPackSize(),
                        concepts.get(node.getConceptId()),
                        brand,
                        newBrandedProductLeafNode,
                        atomicCache,
                        unionOfBrandAndPackNonDefiningProperties,
                        isDevice,
                        modelConfiguration.getLevelOfType(type)));
              });

          productSummaryFutures.add(
              CompletableFuture.allOf(
                      newBrandedPackageNodeFutures
                          .values()
                          .toArray(new CompletableFuture[newBrandedPackageNodeFutures.size()]))
                  .thenApply(
                      v -> {
                        if (log.isLoggable(Level.FINE)) {
                          log.fine(
                              "Created product summary for brand "
                                  + brand.getConceptId()
                                  + " and pack size "
                                  + packSize
                                  + " new TPUU node "
                                  + (newBrandedProductLeafNode != null
                                      && newBrandedProductLeafNode.isNewConcept())
                                  + " new MPP node "
                                  + (newGenericPackageLeafNode != null
                                      && newGenericPackageLeafNode.isNewConcept())
                                  + " new branded package nodes "
                                  + newBrandedPackageNodeFutures.entrySet().stream()
                                      .map(
                                          e ->
                                              "new "
                                                  + e.getKey()
                                                  + " node "
                                                  + e.getValue().join().getConceptId())
                                      .collect(Collectors.joining(", ")));

                          log.fine("Adding edges and nodes");
                        }

                        addEdgesAndNodes(
                            productSummary,
                            brand,
                            newBrandedProductLeafNode,
                            newGenericPackageLeafNode,
                            newBrandedPackageNodeFutures,
                            brandedProductFutureMap,
                            leafUnbrandedProductNode,
                            modelConfiguration);

                        Node subject =
                            newBrandedPackageNodeFutures
                                .get(
                                    modelConfiguration
                                        .getLeafPackageModelLevel()
                                        .getModelLevelType())
                                .join();

                        log.info(
                            "adding subject " + subject.getConceptId() + " to product summary");
                        productSummary.addSubject(subject);

                        return productSummary;
                      }));
        } else {
          log.fine("Skipping existing brand pack size");
        }
      }
    }

    CompletableFuture.allOf(
            productSummaryFutures.toArray(new CompletableFuture[productSummaryFutures.size()]))
        .join();

    Set<Edge> transitiveContainsEdges =
        ProductSummaryService.getTransitiveEdges(productSummary, new HashSet<>());
    productSummary.getEdges().addAll(transitiveContainsEdges);

    productSummary.getNodes().stream()
        .filter(Node::isNewConcept)
        .forEach(
            n ->
                n.getNewConceptDetails()
                    .getAxioms()
                    .forEach(RelationshipSorter::sortRelationships));
    // return the product summary
    return productSummary;
  }

  private CompletableFuture<Node> createNewBrandedPackageNode(
      String branch,
      BigDecimal packSize,
      SnowstormConcept existingConcept,
      SnowstormConceptMini brand,
      Node newLeafBrandedProductNode,
      AtomicCache atomicCache,
      Set<NonDefiningBase> properties,
      boolean isDevice,
      ModelLevel modelLevel) {
    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);
    Set<SnowstormRelationship> newCtppRelationships =
        calculateNewBrandedPackRelationships(
            packSize,
            decimalScale,
            existingConcept,
            brand,
            newLeafBrandedProductNode,
            atomicCache,
            modelConfiguration);

    String semanticTag =
        isDevice ? modelLevel.getDeviceSemanticTag() : modelLevel.getMedicineSemanticTag();

    return nodeGeneratorService
        .generateNodeAsync(
            branch,
            atomicCache,
            newCtppRelationships,
            Set.of(modelLevel.getReferenceSetIdentifier()),
            modelLevel,
            isDevice ? modelLevel.getDrugDeviceSemanticTag() : modelLevel.getMedicineSemanticTag(),
            getReferenceSetMembers(
                properties, models.getModelConfiguration(branch), modelLevel.getModelLevelType()),
            calculateNonDefiningRelationships(
                models.getModelConfiguration(branch), properties, modelLevel.getModelLevelType()),
            List.of(),
            false,
            false,
            true)
        .thenApply(
            n -> {
              nameGenerationService.addGeneratedFsnAndPt(
                  atomicCache, semanticTag, n, modelConfiguration);
              return n;
            });
  }

  private CompletableFuture<Node> createNewGenericPackageNode(
      String branch,
      BigDecimal packSize,
      SnowstormConcept mppConcept,
      AtomicCache atomicCache,
      Set<NonDefiningBase> properties,
      boolean isDevice,
      ModelLevelType modelLevelType) {

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    ModelLevel modelLevel = modelConfiguration.getLevelOfType(modelLevelType);

    Set<SnowstormRelationship> relationships =
        cloneNewRelationships(
            mppConcept.getClassAxioms().iterator().next().getRelationships(),
            modelConfiguration.getModuleId());

    relationships.forEach(
        r -> {
          r.setCharacteristicTypeId(STATED_RELATIONSHUIP_CHARACTRISTIC_TYPE.getValue());
          r.setConcrete(r.getConcreteValue() != null);
          if (r.getTypeId().equals(HAS_PACK_SIZE_VALUE.getValue())) {
            String packSizeString =
                BigDecimalFormatter.formatBigDecimal(
                    packSize, decimalScale, modelConfiguration.isTrimWholeNumbers());
            r.getConcreteValue().setValue(packSizeString);
            r.getConcreteValue().setValueWithPrefix("#" + packSizeString);
          }
          if (r.getTypeId().equals(CONTAINS_DEVICE.getValue())
              || r.getTypeId().equals(CONTAINS_CD.getValue())) {
            atomicCache.addFsn(r.getDestinationId(), r.getTarget().getFsn().getTerm());
          }
        });

    relationships.forEach(
        r -> {
          if (!Boolean.TRUE.equals(r.getConcrete()) && r.getTarget() != null) {
            atomicCache.addFsn(r.getDestinationId(), r.getTarget().getFsn().getTerm());
          }
        });

    String semanticTag =
        isDevice ? modelLevel.getDrugDeviceSemanticTag() : modelLevel.getMedicineSemanticTag();

    return nodeGeneratorService
        .generateNodeAsync(
            branch,
            atomicCache,
            relationships,
            Set.of(modelLevel.getReferenceSetIdentifier()),
            modelLevel,
            isDevice ? modelLevel.getDrugDeviceSemanticTag() : modelLevel.getMedicineSemanticTag(),
            getReferenceSetMembers(
                properties, models.getModelConfiguration(branch), modelLevel.getModelLevelType()),
            calculateNonDefiningRelationships(
                models.getModelConfiguration(branch), properties, modelLevel.getModelLevelType()),
            List.of(),
            false,
            false,
            true)
        .thenApply(
            n -> {
              nameGenerationService.addGeneratedFsnAndPt(
                  atomicCache, semanticTag, n, modelConfiguration);
              return n;
            });
  }

  private CompletableFuture<Node> createNewBrandedProductNode(
      String branch,
      SnowstormConcept leafProductConcept,
      SnowstormConceptMini brand,
      AtomicCache atomicCache,
      Set<NonDefiningBase> properties,
      boolean isDevice,
      ModelLevelType modelLevelType) {

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);
    ModelLevel modelLevel = modelConfiguration.getLevelOfType(modelLevelType);

    Set<SnowstormRelationship> relationships =
        cloneNewRelationships(
                leafProductConcept.getClassAxioms().iterator().next().getRelationships(),
                modelConfiguration.getModuleId())
            .stream()
            .filter(relationship -> !relationship.getTypeId().equals(IS_A.getValue()))
            .collect(Collectors.toSet());

    if (modelLevelType.getAncestors().stream().noneMatch(ModelLevelType::isBranded)) {
      relationships.add(
          SnowstormDtoUtil.getSnowstormRelationship(
              IS_A, MEDICINAL_PRODUCT, 0, modelConfiguration.getModuleId()));
    }

    relationships.forEach(
        r -> {
          r.setConcrete(r.getConcreteValue() != null);
          r.setCharacteristicTypeId(STATED_RELATIONSHUIP_CHARACTRISTIC_TYPE.getValue());
          if (r.getTypeId().equals(HAS_PRODUCT_NAME.getValue())) {
            r.setDestinationId(brand.getConceptId());
            r.setTarget(brand);
          }
        });

    relationships.forEach(
        r -> {
          if (!Boolean.TRUE.equals(r.getConcrete()) && r.getTarget() != null) {
            atomicCache.addFsn(r.getDestinationId(), r.getTarget().getFsn().getTerm());
          }
        });

    String semanticTag =
        isDevice ? modelLevel.getDrugDeviceSemanticTag() : modelLevel.getMedicineSemanticTag();

    return nodeGeneratorService
        .generateNodeAsync(
            branch,
            atomicCache,
            relationships,
            Set.of(modelLevel.getReferenceSetIdentifier()),
            modelLevel,
            isDevice ? modelLevel.getDrugDeviceSemanticTag() : modelLevel.getMedicineSemanticTag(),
            getReferenceSetMembers(
                properties, models.getModelConfiguration(branch), modelLevel.getModelLevelType()),
            calculateNonDefiningRelationships(
                models.getModelConfiguration(branch), properties, modelLevel.getModelLevelType()),
            List.of(),
            false,
            false,
            true)
        .thenApply(
            n -> {
              nameGenerationService.addGeneratedFsnAndPt(
                  atomicCache, semanticTag, n, modelConfiguration);
              return n;
            });
  }
}
