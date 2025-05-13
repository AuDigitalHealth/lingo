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
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.CTPP_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.HAS_PRODUCT_NAME_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.IS_A_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.MPP_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.MPUU_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.TPP_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.TPUU_LABEL;
import static au.gov.digitalhealth.lingo.service.ProductSummaryService.TP_LABEL;
import static au.gov.digitalhealth.lingo.util.AmtConstants.CONTAINS_DEVICE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.CTPP_REFSET_ID;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_DEVICE_TYPE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.MPP_REFSET_ID;
import static au.gov.digitalhealth.lingo.util.AmtConstants.TPP_REFSET_ID;
import static au.gov.digitalhealth.lingo.util.AmtConstants.TPUU_REFSET_ID;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.BRANDED_CLINICAL_DRUG_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.BRANDED_PRODUCT_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CONTAINERIZED_BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CONTAINERIZED_BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CONTAINS_CD;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRODUCT_NAME;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.IS_A;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MEDICINAL_PRODUCT_PACKAGE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.PRODUCT_PACKAGE_SEMANTIC_TAG;
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
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.BrandWithIdentifiers;
import au.gov.digitalhealth.lingo.product.Edge;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.PackSizeWithIdentifiers;
import au.gov.digitalhealth.lingo.product.ProductBrands;
import au.gov.digitalhealth.lingo.product.ProductPackSizes;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.bulk.BrandPackSizeCreationDetails;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import au.gov.digitalhealth.lingo.util.AmtConstants;
import au.gov.digitalhealth.lingo.util.BigDecimalFormatter;
import au.gov.digitalhealth.lingo.util.RelationshipSorter;
import au.gov.digitalhealth.lingo.util.SnomedConstants;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import java.math.BigDecimal;
import java.util.*;
import java.util.Map.Entry;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
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
      BrandPackSizeCreationDetails brandPackSizeCreationDetails, SnowstormConcept ctppConcept) {
    String ctppUnitOfMeasure =
        getSingleActiveTarget(
                getSingleAxiom(ctppConcept).getRelationships(), HAS_PACK_SIZE_UNIT.getValue())
            .getConceptId();

    assert ctppUnitOfMeasure != null;
    if (!ctppUnitOfMeasure.equals(
        brandPackSizeCreationDetails.getPackSizes().getUnitOfMeasure().getConceptId())) {
      throw new ProductAtomicDataValidationProblem(
          "The selected product must have the same pack size unit of measure. The CTPP has a unit of measure of "
              + ctppUnitOfMeasure
              + " and the selected product has a unit of measure of "
              + brandPackSizeCreationDetails.getPackSizes().getUnitOfMeasure().getConceptId());
    }
  }

  private static SnowstormConceptMini validateSingleBrand(
      SnowstormConcept ctppConcept, SnowstormConcept tpuuConcept) {
    SnowstormConceptMini ctppBrand =
        getSingleActiveTarget(
            getSingleAxiom(ctppConcept).getRelationships(), HAS_PRODUCT_NAME.getValue());

    SnowstormConceptMini tpuuBrand =
        getSingleActiveTarget(
            getSingleAxiom(tpuuConcept).getRelationships(), HAS_PRODUCT_NAME.getValue());

    if (!Objects.equals(ctppBrand.getConceptId(), tpuuBrand.getConceptId())) {
      throw new ProductAtomicDataValidationProblem(
          "The brand of the CTPP and TPUU must be the same. Brands were "
              + ctppBrand.getConceptId()
              + " and "
              + tpuuBrand.getConceptId());
    }
    return ctppBrand;
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
        cloneNewRelationships(tppConcept.getClassAxioms().iterator().next().getRelationships());

    for (SnowstormRelationship relationship : newRelationships) {
      relationship.setConcrete(relationship.getConcreteValue() != null);
      relationship.setCharacteristicTypeId(STATED_RELATIONSHUIP_CHARACTRISTIC_TYPE.getValue());
      if (relationship.getTypeId().equals(HAS_PACK_SIZE_VALUE.getValue())) {
        String packSizeString = BigDecimalFormatter.formatBigDecimal(packSize, decimalScale);
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

    newRelationships.add(
        SnowstormDtoUtil.getSnowstormRelationship(
            IS_A, MEDICINAL_PRODUCT_PACKAGE, 0, modelConfiguration.getModuleId()));

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

  private static void addEdgesAndNodes(
      Node newTpuuNode,
      ProductSummary productSummary,
      SnowstormConceptMini brand,
      Node mpuu,
      Node newMppNode,
      CompletableFuture<Node> newTppNode,
      Node tpuu,
      Node mpp,
      CompletableFuture<Node> newCtppNode,
      String moduleId) {

    Node tp = productSummary.getNode(brand.getConceptId());
    if (tp == null) {
      tp = new Node(brand, TP_LABEL);
      productSummary.addNode(tp);
    }

    if (newTpuuNode != null) {
      productSummary.addNode(newTpuuNode);
      productSummary.addEdge(newTpuuNode.getConceptId(), tp.getConceptId(), HAS_PRODUCT_NAME_LABEL);
      productSummary.addEdge(newTpuuNode.getConceptId(), mpuu.getConceptId(), IS_A_LABEL);
      addParent(newTpuuNode, mpuu, moduleId);
    }

    if (newMppNode != null) {
      productSummary.addNode(newMppNode);
      productSummary.addEdge(newMppNode.getConceptId(), mpuu.getConceptId(), CONTAINS_LABEL);
    }

    productSummary.addNode(newTppNode.join());
    productSummary.addEdge(
        newTppNode.join().getConceptId(),
        newTpuuNode == null ? tpuu.getConceptId() : newTpuuNode.getConceptId(),
        CONTAINS_LABEL);
    productSummary.addEdge(
        newTppNode.join().getConceptId(),
        newMppNode == null ? mpp.getConceptId() : newMppNode.getConceptId(),
        IS_A_LABEL);
    addParent(newTppNode.join(), newMppNode == null ? mpp : newMppNode, moduleId);
    productSummary.addEdge(
        newTppNode.join().getConceptId(), tp.getConceptId(), HAS_PRODUCT_NAME_LABEL);

    productSummary.addNode(newCtppNode.join());
    productSummary.addEdge(
        newCtppNode.join().getConceptId(),
        newTpuuNode == null ? tpuu.getConceptId() : newTpuuNode.getConceptId(),
        CONTAINS_LABEL);
    productSummary.addEdge(
        newCtppNode.join().getConceptId(), newTppNode.join().getConceptId(), IS_A_LABEL);
    addParent(newCtppNode.join(), newTppNode.join(), moduleId);
    productSummary.addEdge(
        newCtppNode.join().getConceptId(), tp.getConceptId(), HAS_PRODUCT_NAME_LABEL);
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

    Node ctpp =
        productSummary.getNode(productSummary.getSingleConceptWithLabel(CTPP_LABEL).getConceptId());
    Node tpp =
        productSummary.getNode(productSummary.getSingleConceptWithLabel(TPP_LABEL).getConceptId());
    Node mpp =
        productSummary.getNode(productSummary.getSingleConceptWithLabel(MPP_LABEL).getConceptId());
    Node tpuu =
        productSummary.getNode(productSummary.getSingleConceptWithLabel(TPUU_LABEL).getConceptId());
    Node mpuu =
        productSummary.getNode(productSummary.getSingleConceptWithLabel(MPUU_LABEL).getConceptId());

    Map<String, SnowstormConcept> concepts =
        snowstormClient
            .getBrowserConcepts(
                branch,
                Set.of(
                    ctpp.getConceptId(),
                    tpp.getConceptId(),
                    mpp.getConceptId(),
                    tpuu.getConceptId()))
            .collectMap(SnowstormConcept::getConceptId, c -> c)
            .block();

    assert concepts != null;

    SnowstormConcept ctppConcept = concepts.get(ctpp.getConceptId());
    SnowstormConcept tppConcept = concepts.get(tpp.getConceptId());
    SnowstormConcept mppConcept = concepts.get(mpp.getConceptId());
    SnowstormConcept tpuuConcept = concepts.get(tpuu.getConceptId());

    assertSingleComponentSinglePackProduct(ctppConcept);

    SnowstormConceptMini ctppBrand = validateSingleBrand(ctppConcept, tpuuConcept);

    if (packSizes != null) {
      validateUnitOfMeasure(brandPackSizeCreationDetails, ctppConcept);
    }

    BigDecimal ctppPackSizeValue =
        getSingleActiveBigDecimal(
            getSingleAxiom(ctppConcept).getRelationships(), HAS_PACK_SIZE_VALUE.getValue());

    PackSizeWithIdentifiers cttpPackSize = new PackSizeWithIdentifiers();
    cttpPackSize.setPackSize(ctppPackSizeValue);
    cttpPackSize.setExternalIdentifiers(Collections.emptySet());

    boolean isDevice =
        getSingleOptionalActiveTarget(
                getSingleAxiom(ctppConcept).getRelationships(), HAS_DEVICE_TYPE.getValue())
            != null;

    if ((packSizes == null
            || (packSizes.getPackSizes().size() == 1
                && packSizes
                    .getPackSizes()
                    .iterator()
                    .next()
                    .getPackSize()
                    .equals(cttpPackSize.getPackSize())))
        && (brands == null
            || (brands.getBrands().size() == 1
                && brands
                    .getBrands()
                    .iterator()
                    .next()
                    .getBrand()
                    .getConceptId()
                    .equals(ctppBrand.getConceptId())))) {

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
    List<Pair<String, CompletableFuture<Node>>> tpuuFutures = new ArrayList<>();
    if (brands != null) {
      for (BrandWithIdentifiers brandPackSizeEntry : brands.getBrands()) {
        SnowstormConceptMini brand = brandPackSizeEntry.getBrand();
        // if the brand is different, create a new TPUU node
        if (!brand.getConceptId().equals(ctppBrand.getConceptId())) {
          log.fine("Creating new TPUU node");
          tpuuFutures.add(
              Pair.of(
                  brand.getConceptId(),
                  createNewTpuuNode(branch, tpuuConcept, brand, atomicCache, isDevice)
                      .thenApply(
                          n -> {
                            atomicCache.addFsn(n.getConceptId(), n.getFullySpecifiedName());
                            return n;
                          })));
        } else {
          log.fine("Reusing existing TPUU node");
          atomicCache.addFsn(tpuu.getConceptId(), tpuu.getFullySpecifiedName());
        }
      }
    }

    List<Pair<BigDecimal, CompletableFuture<Node>>> mppFutures = new ArrayList<>();
    if (packSizes != null) {
      for (PackSizeWithIdentifiers packSize : packSizes.getPackSizes()) {
        if (!packSize.getPackSize().equals(cttpPackSize.getPackSize())) {
          log.fine("Creating new MPP node");
          mppFutures.add(
              Pair.of(
                  packSize.getPackSize(),
                  createNewMppNode(
                          branch, packSize.getPackSize(), mppConcept, atomicCache, isDevice)
                      .thenApply(
                          m -> {
                            atomicCache.addFsn(m.getConceptId(), m.getFullySpecifiedName());
                            return m;
                          })));
        } else {
          atomicCache.addFsn(mpp.getConceptId(), mpp.getFullySpecifiedName());
          log.fine("Reusing existing MPP node");
        }
      }
    }

    Map<String, Node> tpuuMap =
        new ConcurrentHashMap<>(
            tpuuFutures.stream()
                .collect(
                    Collectors.toMap(
                        Pair::getLeft,
                        n -> n.getRight().join(),
                        (existing, replacement) -> {
                          if (existing.getConceptId().equals(replacement.getConceptId())) {
                            return existing;
                          } else {
                            throw new IllegalStateException(
                                "Duplicate key with different ConceptId");
                          }
                        })));
    if (tpuuMap.isEmpty()) {
      tpuuMap.put(tpuu.getConceptId(), tpuu);
    }

    Map<BigDecimal, Node> mppMap =
        new ConcurrentHashMap<>(
            mppFutures.stream()
                .collect(
                    Collectors.toMap(
                        Pair::getLeft,
                        n -> n.getRight().join(),
                        (existing, replacement) -> {
                          if (existing.getConceptId().equals(replacement.getConceptId())) {
                            return existing;
                          } else {
                            throw new IllegalStateException(
                                "Duplicate key with different ConceptId");
                          }
                        })));
    if (mppMap.isEmpty()) {
      mppMap.put(cttpPackSize.getPackSize(), mpp);
    }

    Map<SnowstormConceptMini, Set<ExternalIdentifier>> consolidatedBrands =
        brands == null
            ? Map.of(ctppBrand, new HashSet<>())
            : brands.getBrands().stream()
                .collect(
                    Collectors.toMap(
                        BrandWithIdentifiers::getBrand,
                        BrandWithIdentifiers::getExternalIdentifiers,
                        (existing, replacement) -> {
                          existing.addAll(replacement);
                          return existing;
                        }));

    List<CompletableFuture<ProductSummary>> productSummaryFutures = new ArrayList<>();

    Set<PackSizeWithIdentifiers> packSizesToProcess =
        packSizes == null ? Set.of(cttpPackSize) : packSizes.getPackSizes();

    for (Entry<SnowstormConceptMini, Set<ExternalIdentifier>> brandPackSizeEntry :
        consolidatedBrands.entrySet()) {
      SnowstormConceptMini brand = brandPackSizeEntry.getKey();
      Set<ExternalIdentifier> brandExternalIdentifiers = brandPackSizeEntry.getValue();
      for (PackSizeWithIdentifiers packSize : packSizesToProcess) {
        if (!brand.getConceptId().equals(ctppBrand.getConceptId())
            || !packSize.getPackSize().equals(cttpPackSize.getPackSize())) {
          if (log.isLoggable(Level.FINE)) {
            log.fine(
                "Creating new brand pack size for brand "
                    + brand.getConceptId()
                    + " and pack size "
                    + packSize);
          }
          Node newTpuuNode = tpuuMap.get(brand.getConceptId());
          Node newMppNode = mppMap.get(packSize.getPackSize());
          Set<ExternalIdentifier> unionOfBrandAndPackExternalIdentifiers =
              new HashSet<>(packSize.getExternalIdentifiers());
          unionOfBrandAndPackExternalIdentifiers.addAll(brandExternalIdentifiers);

          log.fine("Creating new TPP node");
          CompletableFuture<Node> newTppNode =
              createNewTppNode(
                  branch,
                  packSize.getPackSize(),
                  tppConcept,
                  brand,
                  newTpuuNode,
                  atomicCache,
                  isDevice);

          log.fine("Creating new CTPP node");
          CompletableFuture<Node> newCtppNode =
              createNewCtppNode(
                  branch,
                  packSize.getPackSize(),
                  ctppConcept,
                  brand,
                  newTpuuNode,
                  atomicCache,
                  unionOfBrandAndPackExternalIdentifiers,
                  isDevice);

          productSummaryFutures.add(
              CompletableFuture.allOf(newTppNode, newCtppNode)
                  .thenApply(
                      v -> {
                        if (log.isLoggable(Level.FINE)) {
                          log.fine(
                              "Created product summary for brand "
                                  + brand.getConceptId()
                                  + " and pack size "
                                  + packSize
                                  + " new TPUU node "
                                  + (newTpuuNode != null && newTpuuNode.isNewConcept())
                                  + " new CTPP node "
                                  + newCtppNode.join().isNewConcept()
                                  + " new TPP node "
                                  + newTppNode.join().isNewConcept()
                                  + " new MPP node "
                                  + (newMppNode != null && newMppNode.isNewConcept()));

                          log.fine("Adding edges and nodes");
                        }
                        addEdgesAndNodes(
                            newTpuuNode,
                            productSummary,
                            brand,
                            mpuu,
                            newMppNode,
                            newTppNode,
                            tpuu,
                            mpp,
                            newCtppNode,
                            modelConfiguration.getModuleId());

                        log.fine(
                            "adding subject "
                                + newCtppNode.join().getConceptId()
                                + " to product summary");
                        productSummary.addSubject(newCtppNode.join());

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

  private CompletableFuture<Node> createNewCtppNode(
      String branch,
      BigDecimal packSize,
      SnowstormConcept ctppConcept,
      SnowstormConceptMini brand,
      Node newTpuuNode,
      AtomicCache atomicCache,
      Set<ExternalIdentifier> externalIdentifiers,
      boolean isDevice) {
    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);
    Set<SnowstormRelationship> newCtppRelationships =
        calculateNewBrandedPackRelationships(
            packSize,
            decimalScale,
            ctppConcept,
            brand,
            newTpuuNode,
            atomicCache,
            modelConfiguration);

    String semanticTag =
        isDevice
            ? CONTAINERIZED_BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG.getValue()
            : CONTAINERIZED_BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG.getValue();

    ModelLevel modelLevel =
        modelConfiguration.getLevelOfType(ModelLevelType.REAL_CONTAINERIZED_PACKAGED_CLINICAL_DRUG);

    return nodeGeneratorService
        .generateNodeAsync(
            branch,
            atomicCache,
            newCtppRelationships,
            Set.of(CTPP_REFSET_ID.getValue()),
            modelLevel,
            isDevice ? modelLevel.getDrugDeviceSemanticTag() : modelLevel.getMedicineSemanticTag(),
            SnowstormDtoUtil.getExternalIdentifierReferenceSetEntries(
                externalIdentifiers,
                ModelLevelType.REAL_CONTAINERIZED_PACKAGED_CLINICAL_DRUG,
                models
                    .getModelConfiguration(branch)
                    .getMappingRefsetMapForType(ProductPackageType.PACKAGE)),
            Set.of(), // may need to reconsider if users specify the properties to copy over
            List.of(),
            false,
            false,
            true)
        .thenApply(
            n -> {
              nameGenerationService.addGeneratedFsnAndPt(
                  atomicCache, semanticTag, n, modelConfiguration.getModuleId());
              return n;
            });
  }

  private CompletableFuture<Node> createNewTppNode(
      String branch,
      BigDecimal packSize,
      SnowstormConcept tppConcept,
      SnowstormConceptMini brand,
      Node newTpuuNode,
      AtomicCache atomicCache,
      boolean isDevice) {
    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    Set<SnowstormRelationship> newTppRelationships =
        calculateNewBrandedPackRelationships(
            packSize,
            decimalScale,
            tppConcept,
            brand,
            newTpuuNode,
            atomicCache,
            modelConfiguration);

    String semanticTag =
        isDevice
            ? BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG.getValue()
            : BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG.getValue();

    ModelLevel modelLevel =
        modelConfiguration.getLevelOfType(ModelLevelType.REAL_PACKAGED_CLINICAL_DRUG);

    return nodeGeneratorService
        .generateNodeAsync(
            branch,
            atomicCache,
            newTppRelationships,
            Set.of(TPP_REFSET_ID.getValue()),
            modelLevel,
            isDevice ? modelLevel.getDrugDeviceSemanticTag() : modelLevel.getMedicineSemanticTag(),
            Set.of(),
            Set.of(), // may need to reconsider if users specify the properties to copy over
            List.of(),
            false,
            false,
            true)
        .thenApply(
            n -> {
              nameGenerationService.addGeneratedFsnAndPt(
                  atomicCache, semanticTag, n, modelConfiguration.getModuleId());
              return n;
            });
  }

  private CompletableFuture<Node> createNewMppNode(
      String branch,
      BigDecimal packSize,
      SnowstormConcept mppConcept,
      AtomicCache atomicCache,
      boolean isDevice) {

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    Set<SnowstormRelationship> relationships =
        cloneNewRelationships(mppConcept.getClassAxioms().iterator().next().getRelationships());

    relationships.forEach(
        r -> {
          r.setCharacteristicTypeId(STATED_RELATIONSHUIP_CHARACTRISTIC_TYPE.getValue());
          r.setConcrete(r.getConcreteValue() != null);
          if (r.getTypeId().equals(HAS_PACK_SIZE_VALUE.getValue())) {
            String packSizeString = BigDecimalFormatter.formatBigDecimal(packSize, decimalScale);
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
        isDevice
            ? PRODUCT_PACKAGE_SEMANTIC_TAG.getValue()
            : CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG.getValue();

    ModelLevel modelLevel =
        modelConfiguration.getLevelOfType(ModelLevelType.PACKAGED_CLINICAL_DRUG);

    return nodeGeneratorService
        .generateNodeAsync(
            branch,
            atomicCache,
            relationships,
            Set.of(MPP_REFSET_ID.getValue()),
            modelLevel,
            isDevice ? modelLevel.getDrugDeviceSemanticTag() : modelLevel.getMedicineSemanticTag(),
            Set.of(),
            Set.of(), // may need to reconsider if users specify the properties to copy over
            List.of(),
            false,
            false,
            true)
        .thenApply(
            n -> {
              nameGenerationService.addGeneratedFsnAndPt(
                  atomicCache, semanticTag, n, modelConfiguration.getModuleId());
              return n;
            });
  }

  private CompletableFuture<Node> createNewTpuuNode(
      String branch,
      SnowstormConcept tpuuConcept,
      SnowstormConceptMini brand,
      AtomicCache atomicCache,
      boolean isDevice) {

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

    Set<SnowstormRelationship> relationships =
        cloneNewRelationships(tpuuConcept.getClassAxioms().iterator().next().getRelationships());

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
        isDevice
            ? BRANDED_PRODUCT_SEMANTIC_TAG.getValue()
            : BRANDED_CLINICAL_DRUG_SEMANTIC_TAG.getValue();

    ModelLevel modelLevel = modelConfiguration.getLevelOfType(ModelLevelType.REAL_CLINICAL_DRUG);

    return nodeGeneratorService
        .generateNodeAsync(
            branch,
            atomicCache,
            relationships,
            Set.of(TPUU_REFSET_ID.getValue()),
            modelLevel,
            isDevice ? modelLevel.getDrugDeviceSemanticTag() : modelLevel.getMedicineSemanticTag(),
            Set.of(),
            Set.of(), // may need to reconsider if users specify the properties to copy over
            List.of(),
            false,
            false,
            true)
        .thenApply(
            n -> {
              nameGenerationService.addGeneratedFsnAndPt(
                  atomicCache, semanticTag, n, modelConfiguration.getModuleId());
              return n;
            });
  }
}
