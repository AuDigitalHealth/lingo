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
import au.gov.digitalhealth.lingo.service.fhir.FhirClient;
import au.gov.digitalhealth.lingo.util.EclBuilder;
import au.gov.digitalhealth.lingo.util.ExternalIdentifierUtils;
import au.gov.digitalhealth.lingo.util.NonDefiningPropertyUtils;
import au.gov.digitalhealth.lingo.util.ReferenceSetUtils;
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
import lombok.extern.java.Log;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Log
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
      Maps maps,
      ModelConfiguration modelConfiguration,
      Set<ProductPackageType> productPackageTypes,
      SnowstormConcept product) {

    Set<String> idsInScope = getAncestors(product, maps);
    idsInScope.add(product.getConceptId());

    addNonDefiningProperties(details, maps, modelConfiguration, productPackageTypes, idsInScope);

    addReferenceSets(details, maps, modelConfiguration, productPackageTypes, idsInScope);

    addExternalIdentifiers(details, maps, modelConfiguration, productPackageTypes, idsInScope);
  }

  private static void addExternalIdentifiers(
      PackageProductDetailsBase details,
      Maps maps,
      ModelConfiguration modelConfiguration,
      Set<ProductPackageType> productPackageTypes,
      Set<String> idsInScope) {
    modelConfiguration.getMappings().stream()
        .filter(mappingDefinition -> productPackageTypes.contains(mappingDefinition.getLevel()))
        .forEach(
            mappingDefinition ->
                maps.mappingMap()
                    .forEach(
                        (key, externalIdentifiers) -> {
                          if (idsInScope.contains(key)) {
                            externalIdentifiers.stream()
                                .filter(
                                    externalIdentifier ->
                                        externalIdentifier
                                            .getIdentifierScheme()
                                            .equals(mappingDefinition.getName()))
                                .forEach(
                                    externalIdentifier -> {
                                      if (!details
                                          .getExternalIdentifiers()
                                          .contains(externalIdentifier)) {
                                        details.getExternalIdentifiers().add(externalIdentifier);
                                      }
                                    });
                          }
                        }));
  }

  private static void addReferenceSets(
      PackageProductDetailsBase details,
      Maps maps,
      ModelConfiguration modelConfiguration,
      Set<ProductPackageType> productPackageTypes,
      Set<String> idsInScope) {
    modelConfiguration.getReferenceSets().stream()
        .filter(
            referenceSetDefinition ->
                productPackageTypes.contains(referenceSetDefinition.getLevel()))
        .forEach(
            referenceSetDefinition ->
                maps.referenceSets()
                    .forEach(
                        (key, referenceSets) -> {
                          if (idsInScope.contains(key)) {
                            referenceSets.stream()
                                .filter(
                                    referenceSet ->
                                        referenceSet
                                            .getIdentifierScheme()
                                            .equals(referenceSetDefinition.getName()))
                                .forEach(
                                    referenceSet -> {
                                      if (!details.getReferenceSets().contains(referenceSet)) {
                                        details.getReferenceSets().add(referenceSet);
                                      }
                                    });
                          }
                        }));
  }

  private static void addNonDefiningProperties(
      PackageProductDetailsBase details,
      Maps maps,
      ModelConfiguration modelConfiguration,
      Set<ProductPackageType> productPackageTypes,
      Set<String> idsInScope) {
    modelConfiguration.getNonDefiningProperties().stream()
        .filter(
            nonDefiningPropertyDefinition ->
                productPackageTypes.contains(nonDefiningPropertyDefinition.getLevel()))
        .forEach(
            nonDefiningPropertyDefinition ->
                maps.nonDefiningPropertiesMap()
                    .forEach(
                        (key, nonDefiningProperties) -> {
                          if (idsInScope.contains(key)) {
                            nonDefiningProperties.stream()
                                .filter(
                                    nonDefiningProperty ->
                                        nonDefiningProperty
                                            .getIdentifierScheme()
                                            .equals(nonDefiningPropertyDefinition.getName()))
                                .forEach(
                                    nonDefiningProperty -> {
                                      if (!details
                                          .getNonDefiningProperties()
                                          .contains(nonDefiningProperty)) {
                                        details.getNonDefiningProperties().add(nonDefiningProperty);
                                      }
                                    });
                          }
                        }));
  }

  /**
   * Gets the ancestors of a product concept. Trying to avoid calling the API for speed, but missing
   * ISAs might break this
   *
   * @param product The product concept.
   * @param maps The maps containing the browser map.
   * @return A set of ancestor concept IDs.
   */
  private static Set<String> getAncestors(SnowstormConcept product, Maps maps) {
    log.fine("getAncestors " + product.getConceptId());
    Set<String> ancestors = new HashSet<>();

    product.getClassAxioms().stream()
        .flatMap(a -> a.getRelationships().stream())
        .filter(r -> r.getTypeId().equals(IS_A.getValue()))
        .map(SnowstormRelationship::getDestinationId)
        .distinct()
        .forEach(
            a -> {
              if (!ancestors.contains(a) && maps.browserMap().containsKey(a)) {
                ancestors.add(a);
                ancestors.addAll(getAncestors(maps.browserMap().get(a), maps));
              }
            });

    return ancestors;
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

  protected abstract FhirClient getFhirClient();

  public PackageDetails<T> getPackageAtomicData(String branch, String productId) {
    Maps maps = getMaps(branch, productId, getPackageAtomicDataEcl(getModelConfiguration(branch)));
    return populatePackageDetails(branch, productId, maps, getModelConfiguration(branch));
  }

  public T getProductAtomicData(String branch, String productId) {
    Maps maps = getMaps(branch, productId, getProductAtomicDataEcl(getModelConfiguration(branch)));

    return populateProductDetails(
        branch, maps.browserMap.get(productId), productId, maps, getModelConfiguration(branch));
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
            .getRefsetMembers(branch, concepts, null, 0, 100)
            .map(SnowstormItemsPageReferenceSetMember::getItems)
            .flatMapIterable(c -> c);

    Mono<Map<String, String>> typeMap =
        refsetMembers
            .filter(
                m ->
                    getModelConfiguration(branch).getLevels().stream()
                        .anyMatch(l -> l.getReferenceSetIdentifier().equals(m.getRefsetId())))
            .collect(
                Collectors.toMap(
                    SnowstormReferenceSetMember::getReferencedComponentId,
                    SnowstormReferenceSetMember::getRefsetId,
                    // todo work around NMPC having duplicate refset entries
                    (existing, replacement) -> {
                      log.warning(() -> "Duplicate refset member for " + existing);
                      if (!existing.equals(replacement)) {
                        throw new IllegalStateException(
                            "Duplicate key " + existing + " and " + replacement);
                      }
                      return existing;
                    }));

    Mono<Map<String, List<ExternalIdentifier>>> mappingsMap =
        ExternalIdentifierUtils.getExternalIdentifiersMapFromRefsetMembers(
            refsetMembers, getModelConfiguration(branch).getMappings(), getFhirClient());

    Mono<Map<String, List<au.gov.digitalhealth.lingo.product.details.properties.ReferenceSet>>>
        referenceSets =
            ReferenceSetUtils.getReferenceSetsFromRefsetMembers(
                refsetMembers, getModelConfiguration(branch).getReferenceSets());

    Mono<
            Map<
                String,
                List<au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty>>>
        nonDefiningProperties =
            NonDefiningPropertyUtils.getNonDefiningPropertyFromConcepts(
                browserMap, getModelConfiguration(branch).getNonDefiningProperties());

    Maps maps =
        Mono.zip(browserMap, typeMap, mappingsMap, referenceSets, nonDefiningProperties)
            .map(t -> new Maps(t.getT1(), t.getT2(), t.getT3(), t.getT4(), t.getT5()))
            .block();

    //     todo revisit this after NMPC migration
    if (maps == null) {
      // || !maps.typeMap.keySet().equals(maps.browserMap.keySet())) {
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
            .map(SnowstormItemsPageReferenceSetMember::getItems);

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
                  .collect(Collectors.toSet()),
              getFhirClient()));
      packSizeWithIdentifier.setReferenceSets(
          ReferenceSetUtils.getReferenceSetsFromRefsetMembers(
                  packVariantRefsetMemebersResult, getModelConfiguration(branch).getReferenceSets())
              .getOrDefault(packVariant.getConceptId(), new HashSet<>()));
      packSizeWithIdentifier.setNonDefiningProperties(
          NonDefiningPropertyUtils.getNonDefiningPropertyFromConcepts(
                  Set.of(packVariant), getModelConfiguration(branch).getNonDefiningProperties())
              .getOrDefault(packVariant.getConceptId(), new HashSet<>()));

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

    Map<String, SnowstormConcept> packVariantMap =
        packVariantResult.stream()
            .collect(
                Collectors.toMap(
                    SnowstormConcept::getConceptId,
                    Function.identity(),
                    (existing, replacement) -> existing));

    for (Map.Entry<String, SnowstormConceptMini> entry : packVariantBrandMap.entrySet()) {
      String packVariantId = entry.getKey();
      SnowstormConceptMini brand = entry.getValue();

      // Find the BrandWithIdentifiers if present, or create a new one
      BrandWithIdentifiers brandWithIdentifiers =
          brandsWithIdentifiers.stream()
              .filter(
                  bi ->
                      bi.getBrand().getConceptId() != null
                          && bi.getBrand().getConceptId().equals(brand.getConceptId()))
              .findAny()
              .orElseGet(BrandWithIdentifiers::new);
      boolean newBrand = brandWithIdentifiers.getBrand() == null;
      if (newBrand) {
        brandWithIdentifiers.setBrand(brand);
      }

      brandWithIdentifiers
          .getExternalIdentifiers()
          .addAll(
              ExternalIdentifierUtils.getExternalIdentifiersFromRefsetMembers(
                  packVariantRefsetMemebersResult,
                  packVariantId,
                  getModelConfiguration(branch).getMappings().stream()
                      .filter(m -> m.getLevel().equals(ProductPackageType.PACKAGE))
                      .collect(Collectors.toSet()),
                  getFhirClient()));
      brandWithIdentifiers
          .getReferenceSets()
          .addAll(
              ReferenceSetUtils.getReferenceSetsFromRefsetMembers(
                      packVariantRefsetMemebersResult,
                      getModelConfiguration(branch).getReferenceSets())
                  .getOrDefault(packVariantId, new HashSet<>()));
      brandWithIdentifiers
          .getNonDefiningProperties()
          .addAll(
              NonDefiningPropertyUtils.getNonDefiningPropertyFromConcepts(
                      Set.of(packVariantMap.get(packVariantId)),
                      getModelConfiguration(branch).getNonDefiningProperties())
                  .getOrDefault(packVariantId, new HashSet<>()));

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
                  SnowstormConcept::getConceptId,
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

    if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
      // product name
      details.setProductName(
          getSingleActiveTarget(basePackageRelationships, HAS_PRODUCT_NAME.getValue()));
    }

    addNonDefiningData(
        details, maps, modelConfiguration, Set.of(ProductPackageType.PACKAGE), basePackage);

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

        addNonDefiningData(
            packageQuantity.getPackageDetails(),
            maps,
            modelConfiguration,
            Set.of(ProductPackageType.CONTAINED_PACKAGE),
            maps.browserMap().get(subpacksRelationship.getTarget().getConceptId()));
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
        productDetails, maps, modelConfiguration, Set.of(ProductPackageType.PRODUCT), product);

    return productDetails;
  }

  private record Maps(
      Map<String, SnowstormConcept> browserMap,
      Map<String, String> typeMap,
      Map<String, List<ExternalIdentifier>> mappingMap,
      Map<String, List<au.gov.digitalhealth.lingo.product.details.properties.ReferenceSet>>
          referenceSets,
      Map<String, List<NonDefiningProperty>> nonDefiningPropertiesMap) {}
}
