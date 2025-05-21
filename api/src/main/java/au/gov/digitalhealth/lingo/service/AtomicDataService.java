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

import static au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType.CLINICAL_DRUG;
import static au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType.MEDICINAL_PRODUCT;
import static au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType.REAL_CLINICAL_DRUG;
import static au.gov.digitalhealth.lingo.util.AmtConstants.CONTAINS_DEVICE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_CONTAINER_TYPE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_OTHER_IDENTIFYING_INFORMATION;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CONTAINS_CD;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRODUCT_NAME;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.IS_A;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MEDICINAL_PRODUCT_PACKAGE;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getActiveRelationshipsInRoleGroup;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getActiveRelationshipsOfType;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getRelationshipsFromAxioms;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleActiveBigDecimal;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleActiveConcreteValue;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleActiveTarget;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleAxiom;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormItemsPageReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.aspect.LogExecutionTime;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ReferenceSet;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType;
import au.gov.digitalhealth.lingo.exception.AtomicDataExtractionProblem;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.lingo.product.BrandWithIdentifiers;
import au.gov.digitalhealth.lingo.product.PackSizeWithIdentifiers;
import au.gov.digitalhealth.lingo.product.ProductBrands;
import au.gov.digitalhealth.lingo.product.ProductPackSizes;
import au.gov.digitalhealth.lingo.product.details.*;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty;
import au.gov.digitalhealth.lingo.util.EclBuilder;
import au.gov.digitalhealth.lingo.util.ExternalIdentifierUtils;
import au.gov.digitalhealth.lingo.util.SnomedConstants;
import au.gov.digitalhealth.lingo.util.ValidationUtil;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.util.Pair;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public abstract class AtomicDataService<T extends ProductDetails> {

  public static final String MAP_TARGET = "mapTarget";

  private static Collection<String> getSimilarPackageConcepts(
      SnowstormAxiom axiom,
      SnomedConstants typeToSuppress,
      SnowstormClient snowStormApiClient,
      String branch,
      Map<String, String> substitutionMap,
      Integer limit,
      ModelConfiguration modelConfiguration) {
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

    String ecl =
        EclBuilder.build(
            eclRels,
            Set.of(modelConfiguration.getLeafPackageModelLevel().getReferenceSetIdentifier()),
            false,
            true,
            modelConfiguration);

    for (Map.Entry<String, String> entry : substitutionMap.entrySet()) {
      ecl = ecl.replace(entry.getKey(), "(" + entry.getValue() + ")");
    }

    return snowStormApiClient.getConceptIdsFromEcl(
        branch, ecl, 0, limit != null ? limit : 100, modelConfiguration.isExecuteEclAsStated());
  }

  private static void addNonDefiningData(
      PackageProductDetailsBase details,
      String productId,
      Maps maps,
      ModelConfiguration modelConfiguration,
      Set<SnowstormRelationship> relationships) {
    // maps
    if (maps.mappingMap().containsKey(productId)) {
      details.setExternalIdentifiers(maps.mappingMap().get(productId));
    }
    // reference sets
    if (maps.referenceSets().containsKey(productId)) {
      details.getReferenceSets().addAll(maps.referenceSets().get(productId));
    }

    Map<String, au.gov.digitalhealth.lingo.configuration.model.NonDefiningProperty>
        nonDefiningProperties =
            modelConfiguration.getNonDefiningProperties().stream()
                .filter(m -> m.getLevel().equals(ProductPackageType.PACKAGE))
                .collect(
                    Collectors.toMap(
                        au.gov.digitalhealth.lingo.configuration.model.NonDefiningProperty
                            ::getIdentifier,
                        Function.identity()));

    relationships.stream()
        .filter(r -> nonDefiningProperties.containsKey(r.getTypeId()))
        .forEach(
            r ->
                details
                    .getNonDefiningProperties()
                    .add(new NonDefiningProperty(r, nonDefiningProperties.get(r.getTypeId()))));
  }

  protected abstract SnowstormClient getSnowStormApiClient();

  protected abstract String getPackageAtomicDataEcl(ModelConfiguration modelConfiguration);

  protected abstract String getProductAtomicDataEcl(ModelConfiguration modelConfiguration);

  protected abstract T populateSpecificProductDetails(
      String branch,
      SnowstormConcept product,
      String productId,
      Map<String, SnowstormConcept> browserMap,
      Map<String, String> typeMap,
      ModelConfiguration modelConfiguration);

  protected abstract String getType();

  protected abstract String getContainedUnitRelationshipType();

  protected abstract String getSubpackRelationshipType();

  protected abstract ModelConfiguration getModelConfiguration(String branch);

  public PackageDetails<T> getPackageAtomicData(String branch, String productId) {
    Maps maps =
        getMaps(
            branch,
            productId,
            getPackageAtomicDataEcl(getModelConfiguration(branch)),
            ProductPackageType.PACKAGE);
    return populatePackageDetails(branch, productId, maps, getModelConfiguration(branch));
  }

  public T getProductAtomicData(String branch, String productId) {
    Maps maps =
        getMaps(
            branch,
            productId,
            getProductAtomicDataEcl(getModelConfiguration(branch)),
            ProductPackageType.PRODUCT);

    return populateProductDetails(
        branch, maps.browserMap.get(productId), productId, maps, getModelConfiguration(branch));
  }

  @LogExecutionTime
  private Maps getMaps(String branch, String productId, String ecl, ProductPackageType type) {
    SnowstormClient snowStormApiClient = getSnowStormApiClient();
    Collection<String> concepts = getConceptsToMap(branch, productId, ecl, snowStormApiClient);

    Mono<Map<String, SnowstormConcept>> browserMap =
        snowStormApiClient
            .getBrowserConcepts(branch, concepts)
            .collectMap(SnowstormConcept::getConceptId);

    Flux<SnowstormReferenceSetMember> refsetMembers =
        snowStormApiClient
            .getRefsetMembers(branch, concepts, null, 0, 100)
            .map(r -> r.getItems())
            .flatMapIterable(c -> c);

    Mono<Map<String, String>> typeMap =
        refsetMembers
            .filter(
                m ->
                    getModelConfiguration(branch)
                        .getReferenceSetsForModelLevelTypes(
                            CLINICAL_DRUG, REAL_CLINICAL_DRUG, MEDICINAL_PRODUCT)
                        .contains(m.getRefsetId()))
            .collect(
                Collectors.toMap(
                    SnowstormReferenceSetMember::getReferencedComponentId,
                    SnowstormReferenceSetMember::getRefsetId,
                    // todo work around NMPC having duplicate refset entries
                    (existing, replacement) -> {
                      if (!existing.equals(replacement)) {
                        throw new IllegalStateException(
                            "Duplicate key " + existing + " and " + replacement);
                      }
                      return existing;
                    }));

    Mono<Map<String, List<ExternalIdentifier>>> mappingsMap =
        ExternalIdentifierUtils.getExternalIdentifiersMapFromRefsetMembers(
            refsetMembers,
            productId,
            getModelConfiguration(branch).getMappings().stream()
                .filter(m -> m.getLevel().equals(type))
                .collect(Collectors.toSet()));

    Map<String, ReferenceSet> referenceSetsConfigured =
        getModelConfiguration(branch).getReferenceSets().stream()
            .filter(r -> r.getLevel().equals(type))
            .collect(Collectors.toMap(ReferenceSet::getIdentifier, Function.identity()));

    Mono<Map<String, List<au.gov.digitalhealth.lingo.product.details.properties.ReferenceSet>>>
        referenceSets =
            refsetMembers
                .filter(r -> referenceSetsConfigured.containsKey(r.getRefsetId()))
                .map(
                    s ->
                        Pair.of(
                            s.getReferencedComponentId(),
                            new au.gov.digitalhealth.lingo.product.details.properties.ReferenceSet(
                                referenceSetsConfigured.get(s.getRefsetId()).getName())))
                .collect(
                    Collectors.groupingBy(
                        Pair::getFirst, Collectors.mapping(Pair::getSecond, Collectors.toList())));

    Maps maps =
        Mono.zip(browserMap, typeMap, mappingsMap, referenceSets)
            .map(t -> new Maps(t.getT1(), t.getT2(), t.getT3(), t.getT4()))
            .block();

    // todo revisit this after NMPC migration
    //    if (maps == null || !maps.typeMap.keySet().equals(maps.browserMap.keySet())) {
    //      throw new AtomicDataExtractionProblem(
    //          "Mismatch between browser and refset members", productId);
    //    }
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
        getSimilarPackageConcepts(
            axiom,
            HAS_PACK_SIZE_VALUE,
            snowStormApiClient,
            branch,
            Map.of(),
            100,
            getModelConfiguration(branch));

    Mono<List<SnowstormConcept>> packVariants =
        snowStormApiClient.getBrowserConcepts(branch, packVariantIds).collectList();

    Mono<List<SnowstormReferenceSetMember>> packVariantRefsetMembers =
        snowStormApiClient
            .getRefsetMembers(
                branch,
                packVariantIds,
                null,
                0,
                packVariantIds.size() * 100) // TODO Need to comeback
            .map(r -> r.getItems());

    List<SnowstormConcept> packVariantResult = packVariants.block();

    Set<PackSizeWithIdentifiers> packSizeWithIdentifiers = new HashSet<>();

    List<SnowstormReferenceSetMember> packVariantRefsetMemebersResult =
        packVariantRefsetMembers.block();
    if (packVariantRefsetMemebersResult == null) {
      packVariantRefsetMemebersResult = List.of();
    }

    for (SnowstormConcept packVariant : packVariantResult) {
      PackSizeWithIdentifiers packSizeWithIdentifier = new PackSizeWithIdentifiers();
      packVariant.getClassAxioms().iterator().next().getRelationships().stream()
          .filter(r -> r.getTypeId().equals(HAS_PACK_SIZE_VALUE.getValue()))
          .map(
              r ->
                  new BigDecimal(
                      Objects.requireNonNull(
                          Objects.requireNonNull(r.getConcreteValue()).getValue())))
          .findFirst()
          .ifPresentOrElse(
              packSizeWithIdentifier::setPackSize,
              () -> {
                throw new AtomicDataExtractionProblem(
                    "No pack size found for ", productId.toString());
              });

      packSizeWithIdentifier.setExternalIdentifiers(
          ExternalIdentifierUtils.getExternalIdentifiersFromRefsetMembers(
              packVariantRefsetMemebersResult,
              packVariant.getConceptId(),
              getModelConfiguration(branch).getMappings().stream()
                  .filter(m -> m.getLevel().equals(ProductPackageType.PACKAGE))
                  .collect(Collectors.toSet())));
      packSizeWithIdentifiers.add(packSizeWithIdentifier);
    }

    ProductPackSizes productPackSizes = new ProductPackSizes();

    productPackSizes.setProductId(productId.toString());
    productPackSizes.setPackSizes(packSizeWithIdentifiers);
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
    SnowstormConcept productConcept =
        Mono.from(snowStormApiClient.getBrowserConcepts(branch, Set.of(productId.toString())))
            .block();

    assert productConcept != null;
    ValidationUtil.assertSingleComponentSinglePackProduct(productConcept);

    boolean medication =
        getRelationshipsFromAxioms(productConcept).stream()
            .anyMatch(r -> r.getTypeId().equals(CONTAINS_CD.getValue()));

    SnowstormConcept containedConcept =
        Mono.from(
                snowStormApiClient.getBrowserConcepts(
                    branch,
                    Set.of(
                        Objects.requireNonNull(
                            getSingleActiveTarget(
                                    getSingleAxiom(productConcept).getRelationships(),
                                    medication
                                        ? CONTAINS_CD.getValue()
                                        : CONTAINS_DEVICE.getValue())
                                .getConceptId()))))
            .block();

    assert containedConcept != null;
    String containedProductEcl =
        EclBuilder.build(
            getRelationshipsFromAxioms(containedConcept).stream()
                .filter(r -> !r.getTypeId().equals(HAS_PRODUCT_NAME.getValue()))
                .collect(Collectors.toSet()),
            Set.of(),
            false,
            true,
            getModelConfiguration(branch));

    SnowstormAxiom axiom = getSingleAxiom(productConcept);

    Collection<String> packVariantIds =
        getSimilarPackageConcepts(
            axiom,
            HAS_PRODUCT_NAME,
            snowStormApiClient,
            branch,
            Map.of(Objects.requireNonNull(containedConcept.getConceptId()), containedProductEcl),
            1000,
            getModelConfiguration(branch));

    Mono<List<SnowstormConcept>> packVariants =
        snowStormApiClient.getBrowserConcepts(branch, packVariantIds).collectList();

    Mono<List<SnowstormReferenceSetMember>> packVariantRefsetMembers =
        snowStormApiClient
            .getRefsetMembers(branch, packVariantIds, null, 0, packVariantIds.size() * 100)
            .map(SnowstormItemsPageReferenceSetMember::getItems);

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

    Map<String, SnowstormConceptMini> packVariantBrandMap =
        getPackVariantBrandMap(branch, packVariantResult, productId);

    for (String packVariantId : packVariantBrandMap.keySet()) {

      SnowstormConceptMini brand = packVariantBrandMap.get(packVariantId);

      // Find the BrandWithIdentifiers if present, or create a new one
      BrandWithIdentifiers brandWithIdentifiers =
          brandsWithIdentifiers.stream()
              .filter(bi -> bi.getBrand().getConceptId().equals(brand.getConceptId()))
              .findAny()
              .orElseGet(BrandWithIdentifiers::new);
      boolean newBrand = brandWithIdentifiers.getBrand() == null;
      if (newBrand) {
        brandWithIdentifiers.setBrand(brand);
      }

      Set<ExternalIdentifier> externalIdentifiers =
          brandWithIdentifiers.getExternalIdentifiers() != null
              ? brandWithIdentifiers.getExternalIdentifiers()
              : new HashSet<>();

      externalIdentifiers.addAll(
          ExternalIdentifierUtils.getExternalIdentifiersFromRefsetMembers(
              packVariantRefsetMemebersResult,
              packVariantId,
              getModelConfiguration(branch).getMappings().stream()
                  .filter(m -> m.getLevel().equals(ProductPackageType.PACKAGE))
                  .collect(Collectors.toSet())));

      brandWithIdentifiers.setExternalIdentifiers(externalIdentifiers);
      if (newBrand) { // add only for not existing
        brandsWithIdentifiers.add(brandWithIdentifiers);
      }
    }

    ProductBrands productBrands = new ProductBrands();
    productBrands.setProductId(productId.toString());
    productBrands.setBrands(brandsWithIdentifiers);

    return productBrands;
  }

  private Map<String, SnowstormConceptMini> getPackVariantBrandMap(
      String branch, List<SnowstormConcept> packVariantResult, Long productId) {
    if (getModelConfiguration(branch).getModelType().equals(ModelType.AMT)) {
      return packVariantResult.stream()
          .collect(
              Collectors.toMap(
                  pv -> pv.getConceptId(),
                  pv ->
                      getSingleActiveTarget(
                          getSingleAxiom(pv).getRelationships(), HAS_PRODUCT_NAME.getValue())));
    } else if (getModelConfiguration(branch).getModelType().equals(ModelType.NMPC)) {
      // NMPC doesn't have the product name on the pack concept, only the product concepts
      // so we have to go and find them all
      Map<String, SnowstormConceptMini> map = new HashMap<>();

      for (SnowstormConcept packVariant : packVariantResult) {
        Collection<SnowstormConceptMini> brands =
            getSnowStormApiClient()
                .getConceptsFromEcl(
                    branch,
                    "<id>.774160008.774158006",
                    Long.parseLong(packVariant.getConceptId()),
                    0,
                    100,
                    getModelConfiguration(branch).isExecuteEclAsStated());

        if (brands.isEmpty()) {
          throw new AtomicDataExtractionProblem(
              "No matching brands for contained products of pack "
                  + packVariant.getConceptId()
                  + "|"
                  + packVariant.getFsn()
                  + "|",
              productId.toString());
        } else if (brands.size() > 1) {
          throw new AtomicDataExtractionProblem(
              "Multiple matching brands for contained products of pack "
                  + packVariant.getConceptId()
                  + "|"
                  + packVariant.getFsn()
                  + "|, only products with one brand are supported",
              productId.toString());
        } else {
          map.put(packVariant.getConceptId(), brands.iterator().next());
        }
      }

      return map;
    } else {
      throw new AtomicDataExtractionProblem(
          "Unsupported model type "
              + getModelConfiguration(branch).getModelType().name()
              + " for pack variant brand mapping",
          branch);
    }
  }

  @LogExecutionTime
  private Collection<String> getConceptsToMap(
      String branch, String productId, String ecl, SnowstormClient snowStormApiClient) {
    Collection<String> concepts =
        snowStormApiClient.getConceptsIdsFromEcl(
            branch,
            ecl,
            Long.parseLong(productId),
            0,
            100,
            getModelConfiguration(branch).isExecuteEclAsStated());

    if (concepts.isEmpty()) {
      throw new ResourceNotFoundProblem(
          "No matching concepts for " + productId + " of type " + getType());
    }
    return concepts;
  }

  @SuppressWarnings("null")
  private PackageDetails<T> populatePackageDetails(
      String branch, String productId, Maps maps, ModelConfiguration modelConfiguration) {
    PackageDetails<T> details = new PackageDetails<>();
    SnowstormConcept basePackage = maps.browserMap().get(productId);
    Set<SnowstormRelationship> basePackageRelationships = getRelationshipsFromAxioms(basePackage);

    if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
      // container type
      details.setContainerType(
          getSingleActiveTarget(basePackageRelationships, HAS_CONTAINER_TYPE.getValue()));
    }

    // TODO should exist for Ireland post migration?
    if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
      // product name
      details.setProductName(
          getSingleActiveTarget(basePackageRelationships, HAS_PRODUCT_NAME.getValue()));
    }

    addNonDefiningData(details, productId, maps, modelConfiguration, basePackageRelationships);

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
        packageQuantity.setUnit(getSingleActiveTarget(roleGroup, HAS_PACK_SIZE_UNIT.getValue()));
        // sub pack quantity value
        packageQuantity.setValue(
            new BigDecimal(
                getSingleActiveConcreteValue(roleGroup, HAS_PACK_SIZE_VALUE.getValue())));
        details.getContainedPackages().add(packageQuantity);
        // sub pack product details
        assert subpacksRelationship.getTarget() != null;
        packageQuantity.setPackageDetails(
            populatePackageDetails(
                branch, subpacksRelationship.getTarget().getConceptId(), maps, modelConfiguration));
      }
    } else {
      if (productRelationships.isEmpty()) {
        throw new AtomicDataExtractionProblem(
            "Package has no sub packs, expected product relationships", productId);
      }

      for (SnowstormRelationship subProductRelationship : productRelationships) {
        Set<SnowstormRelationship> subRoleGroup =
            getActiveRelationshipsInRoleGroup(subProductRelationship, basePackageRelationships);
        assert subProductRelationship.getTarget() != null;
        SnowstormConcept product =
            maps.browserMap().get(subProductRelationship.getTarget().getConceptId());

        ProductQuantity<T> productQuantity = new ProductQuantity<>();
        // TODO are there NMPC products with no pack size?

        // contained product quantity value
        productQuantity.setValue(
            getSingleActiveBigDecimal(subRoleGroup, HAS_PACK_SIZE_VALUE.getValue()));
        // contained product quantity unit
        productQuantity.setUnit(getSingleActiveTarget(subRoleGroup, HAS_PACK_SIZE_UNIT.getValue()));

        if (product == null) {
          throw new AtomicDataExtractionProblem(
              "Expected concept to be in downloaded set for the product but was not found: "
                  + subProductRelationship.getTarget().getIdAndFsnTerm(),
              productId);
        }

        // contained product details
        T productDetails =
            populateProductDetails(branch, product, productId, maps, modelConfiguration);
        productQuantity.setProductDetails(productDetails);

        details.getContainedProducts().add(productQuantity);
      }
    }
    return details;
  }

  private T populateProductDetails(
      String branch,
      SnowstormConcept product,
      String productId,
      Maps maps,
      ModelConfiguration modelConfiguration) {

    T productDetails =
        populateSpecificProductDetails(
            branch, product, productId, maps.browserMap(), maps.typeMap(), modelConfiguration);

    if (maps.mappingMap().containsKey(product.getConceptId())) {
      productDetails.setExternalIdentifiers(maps.mappingMap().get(product.getConceptId()));
    }

    if (maps.referenceSets().containsKey(product.getConceptId())) {
      productDetails.getReferenceSets().addAll(maps.referenceSets().get(product.getConceptId()));
    }

    // product name
    Set<SnowstormRelationship> productRelationships = getRelationshipsFromAxioms(product);
    productDetails.setProductName(
        getSingleActiveTarget(productRelationships, HAS_PRODUCT_NAME.getValue()));

    if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
      productDetails.setOtherIdentifyingInformation(
          getSingleActiveConcreteValue(
              productRelationships, HAS_OTHER_IDENTIFYING_INFORMATION.getValue()));
    }

    addNonDefiningData(
        productDetails, product.getConceptId(), maps, modelConfiguration, productRelationships);

    return productDetails;
  }

  private record Maps(
      Map<String, SnowstormConcept> browserMap,
      Map<String, String> typeMap,
      Map<String, List<ExternalIdentifier>> mappingMap,
      Map<String, List<au.gov.digitalhealth.lingo.product.details.properties.ReferenceSet>>
          referenceSets) {}
}
