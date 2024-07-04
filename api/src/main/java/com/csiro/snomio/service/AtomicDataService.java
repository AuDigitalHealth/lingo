package com.csiro.snomio.service;

import static com.csiro.snomio.util.AmtConstants.ARTGID_REFSET;
import static com.csiro.snomio.util.AmtConstants.ARTGID_SCHEME;
import static com.csiro.snomio.util.AmtConstants.CONTAINS_DEVICE;
import static com.csiro.snomio.util.AmtConstants.CTPP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.HAS_CONTAINER_TYPE;
import static com.csiro.snomio.util.AmtConstants.HAS_OTHER_IDENTIFYING_INFORMATION;
import static com.csiro.snomio.util.AmtConstants.MPUU_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.MP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.TPUU_REFSET_ID;
import static com.csiro.snomio.util.SnomedConstants.CONTAINS_CD;
import static com.csiro.snomio.util.SnomedConstants.HAS_PACK_SIZE_UNIT;
import static com.csiro.snomio.util.SnomedConstants.HAS_PACK_SIZE_VALUE;
import static com.csiro.snomio.util.SnomedConstants.HAS_PRODUCT_NAME;
import static com.csiro.snomio.util.SnomedConstants.IS_A;
import static com.csiro.snomio.util.SnomedConstants.MEDICINAL_PRODUCT_PACKAGE;
import static com.csiro.snomio.util.SnowstormDtoUtil.getActiveRelationshipsInRoleGroup;
import static com.csiro.snomio.util.SnowstormDtoUtil.getActiveRelationshipsOfType;
import static com.csiro.snomio.util.SnowstormDtoUtil.getRelationshipsFromAxioms;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSingleActiveBigDecimal;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSingleActiveConcreteValue;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSingleActiveTarget;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSingleAxiom;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import com.csiro.snomio.aspect.LogExecutionTime;
import com.csiro.snomio.exception.AtomicDataExtractionProblem;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.snomio.product.BrandWithIdentifiers;
import com.csiro.snomio.product.ProductBrands;
import com.csiro.snomio.product.ProductPackSizes;
import com.csiro.snomio.product.details.ExternalIdentifier;
import com.csiro.snomio.product.details.PackageDetails;
import com.csiro.snomio.product.details.PackageQuantity;
import com.csiro.snomio.product.details.ProductDetails;
import com.csiro.snomio.product.details.ProductQuantity;
import com.csiro.snomio.util.EclBuilder;
import com.csiro.snomio.util.SnomedConstants;
import com.csiro.snomio.util.ValidationUtil;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Log
public abstract class AtomicDataService<T extends ProductDetails> {

  private static Collection<String> getSimilarConcepts(
      SnowstormAxiom axiom,
      SnomedConstants typeToSuppress,
      SnowstormClient snowStormApiClient,
      String branch,
      Map<String, String> substitutionMap) {
    Set<SnowstormRelationship> eclRels =
        axiom.getRelationships().stream()
            .filter(r -> !r.getTypeId().equals(typeToSuppress.getValue()))
            .filter(r -> !r.getTypeId().equals(IS_A.getValue()))
            .collect(Collectors.toSet());

    eclRels.add(
        new SnowstormRelationship()
            .groupId(0)
            .typeId(IS_A.getValue())
            .active(true)
            .destinationId(MEDICINAL_PRODUCT_PACKAGE.getValue()));

    String ecl = EclBuilder.build(eclRels, Set.of(), false, true);

    for (Map.Entry<String, String> entry : substitutionMap.entrySet()) {
      ecl = ecl.replace(entry.getKey(), "(" + entry.getValue() + ")");
    }

    return snowStormApiClient.getConceptIdsFromEcl(branch, ecl, 0, 100);
  }

  protected abstract SnowstormClient getSnowStormApiClient();

  protected abstract String getPackageAtomicDataEcl();

  protected abstract String getProductAtomicDataEcl();

  protected abstract T populateSpecificProductDetails(
      SnowstormConcept product,
      String productId,
      Map<String, SnowstormConcept> browserMap,
      Map<String, String> typeMap);

  protected abstract String getType();

  protected abstract String getContainedUnitRelationshipType();

  protected abstract String getSubpackRelationshipType();

  public PackageDetails<T> getPackageAtomicData(String branch, String productId) {
    Maps maps = getMaps(branch, productId, getPackageAtomicDataEcl());

    return populatePackageDetails(productId, maps.browserMap(), maps.typeMap(), maps.artgMap());
  }

  public T getProductAtomicData(String branch, String productId) {
    Maps maps = getMaps(branch, productId, getProductAtomicDataEcl());

    return populateProductDetails(
        maps.browserMap.get(productId), productId, maps.browserMap(), maps.typeMap());
  }

  @LogExecutionTime
  private Maps getMaps(String branch, String productId, String ecl) {
    SnowstormClient snowStormApiClient = getSnowStormApiClient();
    Collection<String> concepts = getConceptsToMap(branch, productId, ecl, snowStormApiClient);

    Mono<Map<String, SnowstormConcept>> browserMap =
        snowStormApiClient
            .getBrowserConcepts(branch, concepts)
            .collectMap(SnowstormConcept::getConceptId);

    Flux<SnowstormReferenceSetMember> refsetMembers =
        snowStormApiClient
            .getRefsetMembers(branch, concepts, 0, 100)
            .map(r -> r.getItems())
            .flatMapIterable(c -> c);

    Mono<Map<String, String>> typeMap =
        refsetMembers
            .filter(
                m ->
                    m.getRefsetId().equals(CTPP_REFSET_ID.getValue())
                        || m.getRefsetId().equals(TPUU_REFSET_ID.getValue())
                        || m.getRefsetId().equals(MPUU_REFSET_ID.getValue())
                        || m.getRefsetId().equals(MP_REFSET_ID.getValue()))
            .collect(
                Collectors.toMap(
                    SnowstormReferenceSetMember::getReferencedComponentId,
                    SnowstormReferenceSetMember::getRefsetId));

    Mono<Map<String, Collection<String>>> artgMap =
        refsetMembers
            .filter(m -> m.getRefsetId().equals(ARTGID_REFSET.getValue()))
            .collectMultimap(
                SnowstormReferenceSetMember::getReferencedComponentId,
                m ->
                    m.getAdditionalFields() != null
                        ? m.getAdditionalFields().getOrDefault("mapTarget", null)
                        : null);

    Maps maps =
        Mono.zip(browserMap, typeMap, artgMap)
            .map(t -> new Maps(t.getT1(), t.getT2(), t.getT3()))
            .block();

    if (maps == null || !maps.typeMap.keySet().equals(maps.browserMap.keySet())) {
      throw new AtomicDataExtractionProblem(
          "Mismatch between browser and refset members", productId);
    }
    return maps;
  }

  /**
   * Finds the other pack sizes for a given product.
   *
   * @param branch The branch to search in.
   * @param productId The product ID to search for.
   * @return The other pack sizes for the given product.
   */
  @LogExecutionTime
  public ProductPackSizes getProductPackSizes(String branch, Long productId) {
    SnowstormClient snowStormApiClient = getSnowStormApiClient();
    SnowstormConcept concept =
        Mono.from(snowStormApiClient.getBrowserConcepts(branch, Set.of(productId.toString())))
            .block();

    assert concept != null;
    ValidationUtil.assertSingleComponentSinglePackProduct(concept);

    SnowstormAxiom axiom = getSingleAxiom(concept);

    Collection<String> packVariantIds =
        getSimilarConcepts(axiom, HAS_PACK_SIZE_VALUE, snowStormApiClient, branch, Map.of());

    Mono<List<SnowstormConcept>> packVariants =
        snowStormApiClient.getBrowserConcepts(branch, packVariantIds).collectList();

    List<SnowstormConcept> block = packVariants.block();
    assert block != null;
    Set<BigDecimal> packSizes =
        block.stream()
            .flatMap(c -> c.getClassAxioms().iterator().next().getRelationships().stream())
            .filter(r -> r.getTypeId().equals(HAS_PACK_SIZE_VALUE.getValue()))
            .map(
                r ->
                    new BigDecimal(
                        Objects.requireNonNull(
                            Objects.requireNonNull(r.getConcreteValue()).getValue())))
            .collect(Collectors.toSet());

    if (packSizes.isEmpty()) {
      throw new AtomicDataExtractionProblem("No pack sizes found for ", productId.toString());
    }

    ProductPackSizes productPackSizes = new ProductPackSizes();
    productPackSizes.setProductId(productId.toString());
    productPackSizes.setPackSizes(packSizes);
    productPackSizes.setUnitOfMeasure(
        getSingleActiveTarget(axiom.getRelationships(), HAS_PACK_SIZE_UNIT.getValue()));

    return productPackSizes;
  }

  /**
   * Finds the brands for a given product.
   *
   * @param branch The branch to search in.
   * @param productId The product ID to search for.
   * @return The brands for the given product.
   */
  public ProductBrands getProductBrands(String branch, Long productId) {
    SnowstormClient snowStormApiClient = getSnowStormApiClient();
    SnowstormConcept concept =
        Mono.from(snowStormApiClient.getBrowserConcepts(branch, Set.of(productId.toString())))
            .block();

    assert concept != null;
    ValidationUtil.assertSingleComponentSinglePackProduct(concept);

    boolean medication =
        getRelationshipsFromAxioms(concept).stream()
            .anyMatch(r -> r.getTypeId().equals(CONTAINS_CD.getValue()));

    SnowstormConcept containedConcept =
        Mono.from(
                snowStormApiClient.getBrowserConcepts(
                    branch,
                    Set.of(
                        getSingleActiveTarget(
                                getSingleAxiom(concept).getRelationships(),
                                medication ? CONTAINS_CD.getValue() : CONTAINS_DEVICE.getValue())
                            .getConceptId())))
            .block();

    assert containedConcept != null;
    String containedProductEcl =
        EclBuilder.build(
            getRelationshipsFromAxioms(containedConcept).stream()
                .filter(r -> !r.getTypeId().equals(HAS_PRODUCT_NAME.getValue()))
                .collect(Collectors.toSet()),
            Set.of(),
            false,
            true);

    SnowstormAxiom axiom = getSingleAxiom(concept);

    Collection<String> packVariantIds =
        getSimilarConcepts(
            axiom,
            HAS_PRODUCT_NAME,
            snowStormApiClient,
            branch,
            Map.of(containedConcept.getConceptId(), containedProductEcl));

    Mono<List<SnowstormConcept>> packVariants =
        snowStormApiClient.getBrowserConcepts(branch, packVariantIds).collectList();

    Mono<List<SnowstormReferenceSetMember>> packVariantRefsetMembers =
        snowStormApiClient
            .getRefsetMembers(
                branch, packVariantIds, 0, packVariantIds.size() * 100) // TODO Need to comeback
            .map(r -> r.getItems());

    List<SnowstormConcept> packVariantResult = packVariants.block();
    if (packVariantResult == null || packVariantResult.isEmpty()) {
      throw new AtomicDataExtractionProblem("No pack variants found for ", productId.toString());
    }

    Set<BrandWithIdentifiers> brandsWithIdentifiers = new HashSet<>();

    List<SnowstormReferenceSetMember> packVariantRefsetMemebersResult =
        packVariantRefsetMembers.block();
    if (packVariantRefsetMemebersResult == null) {
      packVariantRefsetMemebersResult = List.of();
    }

    for (SnowstormConcept packVariant : packVariantResult) {
      BrandWithIdentifiers brandWithIdentifiers = new BrandWithIdentifiers();
      brandWithIdentifiers.setBrand(
          getSingleActiveTarget(
              getSingleAxiom(packVariant).getRelationships(), HAS_PRODUCT_NAME.getValue()));

      Set<ExternalIdentifier> externalIdentifiers = new HashSet<>();
      for (SnowstormReferenceSetMember refsetMember : packVariantRefsetMemebersResult) {
        if (refsetMember.getReferencedComponentId().equals(packVariant.getConceptId())
            && refsetMember.getRefsetId().equals(ARTGID_REFSET.getValue())) {
          externalIdentifiers.add(
              new ExternalIdentifier(
                  ARTGID_SCHEME.getValue(), refsetMember.getAdditionalFields().get("mapTarget")));
        }
      }
      brandWithIdentifiers.setExternalIdentifiers(externalIdentifiers);
      brandsWithIdentifiers.add(brandWithIdentifiers);
    }

    ProductBrands productBrands = new ProductBrands();
    productBrands.setProductId(productId.toString());
    productBrands.setBrands(brandsWithIdentifiers);

    return productBrands;
  }

  @LogExecutionTime
  private Collection<String> getConceptsToMap(
      String branch, String productId, String ecl, SnowstormClient snowStormApiClient) {
    Collection<String> concepts =
        snowStormApiClient.getConceptsIdsFromEcl(branch, ecl, Long.parseLong(productId), 0, 100);

    if (concepts.isEmpty()) {
      throw new ResourceNotFoundProblem(
          "No matching concepts for " + productId + " of type " + getType());
    }
    return concepts;
  }

  private PackageDetails<T> populatePackageDetails(
      String productId,
      Map<String, SnowstormConcept> browserMap,
      Map<String, String> typeMap,
      Map<String, Collection<String>> artgMap) {

    PackageDetails<T> details = new PackageDetails<>();

    SnowstormConcept basePackage = browserMap.get(productId);
    Set<SnowstormRelationship> basePackageRelationships = getRelationshipsFromAxioms(basePackage);
    // container type
    details.setContainerType(
        getSingleActiveTarget(basePackageRelationships, HAS_CONTAINER_TYPE.getValue()));
    // product name
    details.setProductName(
        getSingleActiveTarget(basePackageRelationships, HAS_PRODUCT_NAME.getValue()));
    // ARTG ID
    if (artgMap.containsKey(productId)) {
      artgMap
          .get(productId)
          .forEach(
              artg ->
                  details
                      .getExternalIdentifiers()
                      .add(new ExternalIdentifier("https://www.tga.gov.au/artg", artg)));
    }

    Set<SnowstormRelationship> subpacksRelationships =
        getActiveRelationshipsOfType(basePackageRelationships, getSubpackRelationshipType());
    Set<SnowstormRelationship> productRelationships =
        getActiveRelationshipsOfType(basePackageRelationships, getContainedUnitRelationshipType());

    if (!subpacksRelationships.isEmpty()) {
      if (!productRelationships.isEmpty()) {
        throw new AtomicDataExtractionProblem(
            "Multipack should not have direct products", productId);
      }
      for (SnowstormRelationship subpacksRelationship : subpacksRelationships) {
        Set<SnowstormRelationship> roleGroup =
            getActiveRelationshipsInRoleGroup(subpacksRelationship, basePackageRelationships);
        PackageQuantity<T> packageQuantity = new PackageQuantity<>();
        details.getContainedPackages().add(packageQuantity);
        // sub pack quantity unit
        packageQuantity.setUnit(getSingleActiveTarget(roleGroup, HAS_PACK_SIZE_UNIT.getValue()));
        // sub pack quantity value
        packageQuantity.setValue(
            new BigDecimal(
                getSingleActiveConcreteValue(roleGroup, HAS_PACK_SIZE_VALUE.getValue())));
        // sub pack product details
        assert subpacksRelationship.getTarget() != null;
        packageQuantity.setPackageDetails(
            populatePackageDetails(
                subpacksRelationship.getTarget().getConceptId(), browserMap, typeMap, artgMap));
      }
    } else {
      if (productRelationships.isEmpty()) {
        throw new AtomicDataExtractionProblem(
            "Package has no sub packs, expected product relationships", productId);
      }

      for (SnowstormRelationship subProductRelationship : productRelationships) {
        Set<SnowstormRelationship> subRoleGroup =
            getActiveRelationshipsInRoleGroup(subProductRelationship, basePackageRelationships);
        ProductQuantity<T> productQuantity = new ProductQuantity<>();
        details.getContainedProducts().add(productQuantity);
        // contained product quantity value
        productQuantity.setValue(
            getSingleActiveBigDecimal(subRoleGroup, HAS_PACK_SIZE_VALUE.getValue()));
        // contained product quantity unit
        productQuantity.setUnit(getSingleActiveTarget(subRoleGroup, HAS_PACK_SIZE_UNIT.getValue()));

        assert subProductRelationship.getTarget() != null;
        SnowstormConcept product =
            browserMap.get(subProductRelationship.getTarget().getConceptId());

        if (product == null) {
          throw new AtomicDataExtractionProblem(
              "Expected concept to be in downloaded set for the product but was not found: "
                  + subProductRelationship.getTarget().getIdAndFsnTerm(),
              productId);
        }

        // contained product details
        productQuantity.setProductDetails(
            populateProductDetails(product, productId, browserMap, typeMap));
      }
    }
    return details;
  }

  private T populateProductDetails(
      SnowstormConcept product,
      String productId,
      Map<String, SnowstormConcept> browserMap,
      Map<String, String> typeMap) {

    T productDetails = populateSpecificProductDetails(product, productId, browserMap, typeMap);

    // product name
    Set<SnowstormRelationship> productRelationships = getRelationshipsFromAxioms(product);
    productDetails.setProductName(
        getSingleActiveTarget(productRelationships, HAS_PRODUCT_NAME.getValue()));

    productDetails.setOtherIdentifyingInformation(
        getSingleActiveConcreteValue(
            productRelationships, HAS_OTHER_IDENTIFYING_INFORMATION.getValue()));

    return productDetails;
  }

  private record Maps(
      Map<String, SnowstormConcept> browserMap,
      Map<String, String> typeMap,
      Map<String, Collection<String>> artgMap) {}
}
