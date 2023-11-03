package com.csiro.snomio.service;

import static com.csiro.snomio.util.AmtConstants.ARTGID_REFSET;
import static com.csiro.snomio.util.AmtConstants.CTPP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.HAS_CONTAINER_TYPE;
import static com.csiro.snomio.util.AmtConstants.HAS_OTHER_IDENTIFYING_INFORMATION;
import static com.csiro.snomio.util.AmtConstants.MPUU_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.MP_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.TPUU_REFSET_ID;
import static com.csiro.snomio.util.SnomedConstants.HAS_PACK_SIZE_UNIT;
import static com.csiro.snomio.util.SnomedConstants.HAS_PACK_SIZE_VALUE;
import static com.csiro.snomio.util.SnomedConstants.HAS_PRODUCT_NAME;
import static com.csiro.snomio.util.SnowstormDtoUtil.getActiveRelationshipsInRoleGroup;
import static com.csiro.snomio.util.SnowstormDtoUtil.getActiveRelationshipsOfType;
import static com.csiro.snomio.util.SnowstormDtoUtil.getRelationshipsFromAxioms;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSingleActiveBigDecimal;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSingleActiveConcreteValue;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSingleActiveTarget;

import au.csiro.snowstorm_client.model.SnowstormConceptComponent;
import au.csiro.snowstorm_client.model.SnowstormConceptMiniComponent;
import au.csiro.snowstorm_client.model.SnowstormItemsPageReferenceSetMemberComponent;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberComponent;
import au.csiro.snowstorm_client.model.SnowstormRelationshipComponent;
import com.csiro.snomio.exception.AtomicDataExtractionProblem;
import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.snomio.models.product.ExternalIdentifier;
import com.csiro.snomio.models.product.PackageDetails;
import com.csiro.snomio.models.product.PackageQuantity;
import com.csiro.snomio.models.product.ProductDetails;
import com.csiro.snomio.models.product.ProductQuantity;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import reactor.core.publisher.Mono;

@Log
public abstract class AtomicDataService<T extends ProductDetails> {

  protected abstract SnowstormClient getSnowStormApiClient();

  protected abstract String getPackageAtomicDataEcl();

  protected abstract String getProductAtomicDataEcl();

  protected abstract T populateSpecificProductDetails(
      SnowstormConceptComponent product,
      String productId,
      Map<String, SnowstormConceptComponent> browserMap,
      Map<String, String> typeMap);

  protected abstract String getType();

  protected abstract String getContainedUnitRelationshipType();

  protected abstract String getSubpackRelationshipType();

  public PackageDetails<T> getPackageAtomicData(String branch, String productId) {
    Maps maps = getMaps(branch, productId, this::getPackageAtomicDataEcl);

    return populatePackageDetails(productId, maps.browserMap(), maps.typeMap(), maps.artgMap());
  }

  public T getProductAtomicData(String branch, String productId) {
    Maps maps = getMaps(branch, productId, this::getProductAtomicDataEcl);

    return populateProductDetails(
        maps.browserMap.get(productId), productId, maps.browserMap(), maps.typeMap());
  }

  private Maps getMaps(String branch, String productId, Supplier<String> ecl) {
    Collection<SnowstormConceptMiniComponent> concepts =
        getSnowStormApiClient().getConceptsFromEcl(branch, ecl.get(), productId, 0, 100);

    if (concepts.isEmpty()) {
      throw new ResourceNotFoundProblem(
          "No matching concepts for " + productId + " of type " + getType());
    }

    // get the concepts involved in this product
    Mono<List<SnowstormConceptComponent>> browserConcepts =
        getSnowStormApiClient().getBrowserConcepts(branch, concepts);

    // categorise them using the reference sets
    Mono<SnowstormItemsPageReferenceSetMemberComponent> refsetMembers =
        getSnowStormApiClient().getRefsetMembers(branch, concepts, 0, 100);

    List<SnowstormConceptComponent> browserConceptList = browserConcepts.block();
    if (browserConceptList == null) {
      throw new AtomicDataExtractionProblem("No browser concepts found", productId);
    }
    Map<String, SnowstormConceptComponent> browserMap =
        browserConceptList.stream()
            .collect(Collectors.toMap(SnowstormConceptComponent::getConceptId, c -> c));

    SnowstormItemsPageReferenceSetMemberComponent refsetMembersList = refsetMembers.block();
    if (refsetMembersList == null || refsetMembersList.getItems() == null) {
      throw new AtomicDataExtractionProblem("No browser concepts found", productId);
    }
    Map<String, String> typeMap =
        refsetMembersList.getItems().stream()
            .filter(
                m ->
                    m.getRefsetId().equals(CTPP_REFSET_ID)
                        || m.getRefsetId().equals(TPUU_REFSET_ID)
                        || m.getRefsetId().equals(MPUU_REFSET_ID)
                        || m.getRefsetId().equals(MP_REFSET_ID))
            .collect(
                Collectors.toMap(
                    SnowstormReferenceSetMemberComponent::getReferencedComponentId,
                    SnowstormReferenceSetMemberComponent::getRefsetId));

    Map<String, Set<String>> artgMap = new HashMap<>();
    refsetMembersList.getItems().stream()
        .filter(m -> m.getRefsetId().equals(ARTGID_REFSET))
        .forEach(
            m ->
                artgMap
                    .computeIfAbsent(m.getReferencedComponentId(), k -> new HashSet<>())
                    .add(
                        m.getAdditionalFields() != null
                            ? m.getAdditionalFields().getOrDefault("mapTarget", null)
                            : null));

    if (!typeMap.keySet().equals(browserMap.keySet())) {
      throw new AtomicDataExtractionProblem(
          "Mismatch between browser and refset members", productId);
    }
    return new Maps(browserMap, typeMap, artgMap);
  }

  private PackageDetails<T> populatePackageDetails(
      String productId,
      Map<String, SnowstormConceptComponent> browserMap,
      Map<String, String> typeMap,
      Map<String, Set<String>> artgMap) {

    PackageDetails<T> details = new PackageDetails<>();

    SnowstormConceptComponent basePackage = browserMap.get(productId);
    Set<SnowstormRelationshipComponent> basePackageRelationships =
        getRelationshipsFromAxioms(basePackage);
    // container type
    details.setContainerType(getSingleActiveTarget(basePackageRelationships, HAS_CONTAINER_TYPE));
    // product name
    details.setProductName(getSingleActiveTarget(basePackageRelationships, HAS_PRODUCT_NAME));
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

    Set<SnowstormRelationshipComponent> subpacksRelationships =
        getActiveRelationshipsOfType(basePackageRelationships, getSubpackRelationshipType());
    Set<SnowstormRelationshipComponent> productRelationships =
        getActiveRelationshipsOfType(basePackageRelationships, getContainedUnitRelationshipType());

    if (!subpacksRelationships.isEmpty()) {
      if (!productRelationships.isEmpty()) {
        throw new AtomicDataExtractionProblem(
            "Multipack should not have direct products", productId);
      }
      for (SnowstormRelationshipComponent subpacksRelationship : subpacksRelationships) {
        Set<SnowstormRelationshipComponent> roleGroup =
            getActiveRelationshipsInRoleGroup(subpacksRelationship, basePackageRelationships);
        PackageQuantity<T> packageQuantity = new PackageQuantity<>();
        details.getContainedPackages().add(packageQuantity);
        // sub pack quantity unit
        packageQuantity.setUnit(getSingleActiveTarget(roleGroup, HAS_PACK_SIZE_UNIT));
        // sub pack quantity value
        packageQuantity.setValue(
            new BigDecimal(getSingleActiveConcreteValue(roleGroup, HAS_PACK_SIZE_VALUE)));
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

      for (SnowstormRelationshipComponent subProductRelationship : productRelationships) {
        Set<SnowstormRelationshipComponent> subRoleGroup =
            getActiveRelationshipsInRoleGroup(subProductRelationship, basePackageRelationships);
        ProductQuantity<T> productQuantity = new ProductQuantity<>();
        details.getContainedProducts().add(productQuantity);
        // contained product quantity value
        productQuantity.setValue(getSingleActiveBigDecimal(subRoleGroup, HAS_PACK_SIZE_VALUE));
        // contained product quantity unit
        productQuantity.setUnit(getSingleActiveTarget(subRoleGroup, HAS_PACK_SIZE_UNIT));

        assert subProductRelationship.getTarget() != null;
        SnowstormConceptComponent product =
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
      SnowstormConceptComponent product,
      String productId,
      Map<String, SnowstormConceptComponent> browserMap,
      Map<String, String> typeMap) {

    T productDetails = populateSpecificProductDetails(product, productId, browserMap, typeMap);

    // product name
    Set<SnowstormRelationshipComponent> productRelationships = getRelationshipsFromAxioms(product);
    productDetails.setProductName(getSingleActiveTarget(productRelationships, HAS_PRODUCT_NAME));

    productDetails.setOtherIdentifyingInformation(
        getSingleActiveConcreteValue(productRelationships, HAS_OTHER_IDENTIFYING_INFORMATION));

    return productDetails;
  }

  private record Maps(
      Map<String, SnowstormConceptComponent> browserMap,
      Map<String, String> typeMap,
      Map<String, Set<String>> artgMap) {}
}
