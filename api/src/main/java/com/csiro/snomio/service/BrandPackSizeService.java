package com.csiro.snomio.service;

import static com.csiro.snomio.service.ProductSummaryService.CONTAINS_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.CTPP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.HAS_PRODUCT_NAME_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.IS_A_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.MPP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.MPUU_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.TPP_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.TPUU_LABEL;
import static com.csiro.snomio.service.ProductSummaryService.TP_LABEL;
import static com.csiro.snomio.util.AmtConstants.CONTAINS_DEVICE;
import static com.csiro.snomio.util.AmtConstants.CTPP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.HAS_DEVICE_TYPE;
import static com.csiro.snomio.util.AmtConstants.MPP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.TPP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.TPUU_REFSET_ID;
import static com.csiro.snomio.util.SnomedConstants.BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.BRANDED_CLINICAL_DRUG_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.BRANDED_PRODUCT_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CONTAINERIZED_BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CONTAINERIZED_BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.CONTAINS_CD;
import static com.csiro.snomio.util.SnomedConstants.HAS_PACK_SIZE_UNIT;
import static com.csiro.snomio.util.SnomedConstants.HAS_PACK_SIZE_VALUE;
import static com.csiro.snomio.util.SnomedConstants.HAS_PRODUCT_NAME;
import static com.csiro.snomio.util.SnomedConstants.IS_A;
import static com.csiro.snomio.util.SnomedConstants.MEDICINAL_PRODUCT_PACKAGE;
import static com.csiro.snomio.util.SnomedConstants.PRODUCT_PACKAGE_SEMANTIC_TAG;
import static com.csiro.snomio.util.SnomedConstants.STATED_RELATIONSHUIP_CHARACTRISTIC_TYPE;
import static com.csiro.snomio.util.SnowstormDtoUtil.cloneNewRelationships;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSingleActiveBigDecimal;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSingleActiveTarget;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSingleAxiom;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSingleOptionalActiveTarget;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSnowstormRelationship;
import static com.csiro.snomio.util.ValidationUtil.assertSingleComponentSinglePackProduct;

import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import com.csiro.snomio.exception.ProductAtomicDataValidationProblem;
import com.csiro.snomio.product.*;
import com.csiro.snomio.product.bulk.BrandPackSizeCreationDetails;
import com.csiro.snomio.product.details.ExternalIdentifier;
import com.csiro.snomio.util.AmtConstants;
import com.csiro.snomio.util.RelationshipSorter;
import com.csiro.snomio.util.SnomedConstants;
import com.csiro.snomio.util.SnowstormDtoUtil;
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
import org.springframework.stereotype.Service;

@Service
@Log
public class BrandPackSizeService {

  private final ProductSummaryService productSummaryService;
  private final SnowstormClient snowstormClient;
  private final NameGenerationService nameGenerationService;
  private final NodeGeneratorService nodeGeneratorService;

  @Autowired
  public BrandPackSizeService(
      SnowstormClient snowstormClient,
      NameGenerationService nameGenerationService,
      NodeGeneratorService nodeGeneratorService,
      ProductSummaryService productSummaryService) {
    this.snowstormClient = snowstormClient;
    this.nameGenerationService = nameGenerationService;
    this.nodeGeneratorService = nodeGeneratorService;
    this.productSummaryService = productSummaryService;
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
      SnowstormConcept tppConcept,
      SnowstormConceptMini brand,
      Node newTpuuNode) {
    Set<SnowstormRelationship> newTppRelationships =
        cloneNewRelationships(tppConcept.getClassAxioms().iterator().next().getRelationships());

    for (SnowstormRelationship relationship : newTppRelationships) {
      relationship.setConcrete(relationship.getConcreteValue() != null);
      relationship.setCharacteristicTypeId(STATED_RELATIONSHUIP_CHARACTRISTIC_TYPE.getValue());
      if (relationship.getTypeId().equals(HAS_PACK_SIZE_VALUE.getValue())) {
        Objects.requireNonNull(relationship.getConcreteValue()).setValue(packSize.toString());
        Objects.requireNonNull(relationship.getConcreteValue()).setValueWithPrefix("#" + packSize);
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

    newTppRelationships =
        newTppRelationships.stream()
            .filter(r -> !r.getTypeId().equals(IS_A.getValue()))
            .collect(Collectors.toSet());

    newTppRelationships.add(
        SnowstormDtoUtil.getSnowstormRelationship(IS_A, MEDICINAL_PRODUCT_PACKAGE, 0));

    return newTppRelationships;
  }

  private static void addParent(Node child, Node parent) {
    if (child.isNewConcept()) {
      child
          .getNewConceptDetails()
          .getAxioms()
          .forEach(a -> a.getRelationships().add(getSnowstormRelationship(IS_A, parent, 0)));
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
      CompletableFuture<Node> newCtppNode) {

    Node tp = productSummary.getNode(brand.getConceptId());
    if (tp == null) {
      tp = new Node(brand, TP_LABEL);
      productSummary.addNode(tp);
    }

    if (newTpuuNode != null) {
      productSummary.addNode(newTpuuNode);
      productSummary.addEdge(newTpuuNode.getConceptId(), tp.getConceptId(), HAS_PRODUCT_NAME_LABEL);
      productSummary.addEdge(newTpuuNode.getConceptId(), mpuu.getConceptId(), IS_A_LABEL);
      addParent(newTpuuNode, mpuu);
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
    addParent(newTppNode.join(), newMppNode == null ? mpp : newMppNode);
    productSummary.addEdge(
        newTppNode.join().getConceptId(), tp.getConceptId(), HAS_PRODUCT_NAME_LABEL);

    productSummary.addNode(newCtppNode.join());
    productSummary.addEdge(
        newCtppNode.join().getConceptId(),
        newTpuuNode == null ? tpuu.getConceptId() : newTpuuNode.getConceptId(),
        CONTAINS_LABEL);
    productSummary.addEdge(
        newCtppNode.join().getConceptId(), newTppNode.join().getConceptId(), IS_A_LABEL);
    addParent(newCtppNode.join(), newTppNode.join());
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
    cttpPackSize.setExternalIdentifiers(Collections.EMPTY_SET);

    boolean isDevice =
        getSingleOptionalActiveTarget(
                getSingleAxiom(ctppConcept).getRelationships(), HAS_DEVICE_TYPE.getValue())
            != null;

    if ((packSizes == null
            || (packSizes.getPackSizes().size() == 1
                && packSizes.getPackSizes().iterator().next().equals(cttpPackSize.getPackSize())))
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
              new HashSet(packSize.getExternalIdentifiers());
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
                  unionOfBrandAndPackExternalIdentifiers,
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
                            newCtppNode);

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
    Set<SnowstormRelationship> newCtppRelationships =
        calculateNewBrandedPackRelationships(packSize, ctppConcept, brand, newTpuuNode);

    newCtppRelationships.forEach(
        r -> {
          if (!Boolean.TRUE.equals(r.getConcrete()) && r.getTarget() != null) {
            atomicCache.addFsn(r.getDestinationId(), r.getTarget().getFsn().getTerm());
          }
        });

    String semanticTag =
        isDevice
            ? CONTAINERIZED_BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG.getValue()
            : CONTAINERIZED_BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG.getValue();

    return nodeGeneratorService
        .generateNodeAsync(
            branch,
            atomicCache,
            newCtppRelationships,
            Set.of(CTPP_REFSET_ID.getValue()),
            CTPP_LABEL,
            SnowstormDtoUtil.getExternalIdentifierReferenceSetEntries(externalIdentifiers),
            semanticTag,
            List.of(),
            false,
            false)
        .thenApply(
            n -> {
              nameGenerationService.addGeneratedFsnAndPt(atomicCache, semanticTag, n);
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
      Set<ExternalIdentifier> externalIdentifiers,
      boolean isDevice) {
    Set<SnowstormRelationship> newTppRelationships =
        calculateNewBrandedPackRelationships(packSize, tppConcept, brand, newTpuuNode);

    newTppRelationships.forEach(
        r -> {
          if (!Boolean.TRUE.equals(r.getConcrete()) && r.getTarget() != null) {
            atomicCache.addFsn(r.getDestinationId(), r.getTarget().getFsn().getTerm());
          }
        });

    String semanticTag =
        isDevice
            ? BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG.getValue()
            : BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG.getValue();

    return nodeGeneratorService
        .generateNodeAsync(
            branch,
            atomicCache,
            newTppRelationships,
            Set.of(TPP_REFSET_ID.getValue()),
            TPP_LABEL,
            SnowstormDtoUtil.getExternalIdentifierReferenceSetEntries(externalIdentifiers),
            BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG.getValue(),
            List.of(),
            false,
            false)
        .thenApply(
            n -> {
              nameGenerationService.addGeneratedFsnAndPt(atomicCache, semanticTag, n);
              return n;
            });
  }

  private CompletableFuture<Node> createNewMppNode(
      String branch,
      BigDecimal packSize,
      SnowstormConcept mppConcept,
      AtomicCache atomicCache,
      boolean isDevice) {

    Set<SnowstormRelationship> relationships =
        cloneNewRelationships(mppConcept.getClassAxioms().iterator().next().getRelationships());

    relationships.forEach(
        r -> {
          r.setCharacteristicTypeId(STATED_RELATIONSHUIP_CHARACTRISTIC_TYPE.getValue());
          r.setConcrete(r.getConcreteValue() != null);
          if (r.getTypeId().equals(HAS_PACK_SIZE_VALUE.getValue())) {
            r.getConcreteValue().setValue(packSize.toString());
            r.getConcreteValue().setValueWithPrefix("#" + packSize);
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

    return nodeGeneratorService
        .generateNodeAsync(
            branch,
            atomicCache,
            relationships,
            Set.of(MPP_REFSET_ID.getValue()),
            MPP_LABEL,
            Set.of(),
            semanticTag,
            List.of(),
            false,
            false)
        .thenApply(
            n -> {
              nameGenerationService.addGeneratedFsnAndPt(atomicCache, semanticTag, n);
              return n;
            });
  }

  private CompletableFuture<Node> createNewTpuuNode(
      String branch,
      SnowstormConcept tpuuConcept,
      SnowstormConceptMini brand,
      AtomicCache atomicCache,
      boolean isDevice) {
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

    return nodeGeneratorService
        .generateNodeAsync(
            branch,
            atomicCache,
            relationships,
            Set.of(TPUU_REFSET_ID.getValue()),
            TPUU_LABEL,
            Set.of(),
            semanticTag,
            List.of(),
            false,
            false)
        .thenApply(
            n -> {
              nameGenerationService.addGeneratedFsnAndPt(atomicCache, semanticTag, n);
              return n;
            });
  }
}
