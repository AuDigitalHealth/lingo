package com.csiro.snomio.service;

import static com.csiro.snomio.util.AmtConstants.CONTAINS_DEVICE;
import static com.csiro.snomio.util.AmtConstants.CONTAINS_PACKAGED_DEVICE;
import static com.csiro.snomio.util.AmtConstants.MPUU_REFSET_ID;
import static com.csiro.snomio.util.AmtConstants.MP_REFSET_ID;
import static com.csiro.snomio.util.SnomedConstants.IS_A;
import static com.csiro.snomio.util.SnowstormDtoUtil.filterActiveStatedRelationshipByType;
import static com.csiro.snomio.util.SnowstormDtoUtil.getRelationshipsFromAxioms;

import au.csiro.snowstorm_client.model.SnowstormConceptComponent;
import au.csiro.snowstorm_client.model.SnowstormConceptMiniComponent;
import au.csiro.snowstorm_client.model.SnowstormRelationshipComponent;
import com.csiro.snomio.exception.AtomicDataExtractionProblem;
import com.csiro.snomio.models.product.DeviceProductDetails;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/** Service for product-centric operations */
@Service
@Log
public class DeviceService extends AtomicDataService<DeviceProductDetails> {
  private static final String PACKAGE_CONCEPTS_FOR_ATOMIC_EXTRACTION_DEVICE_ECL =
      "(<id> or (<id>.999000111000168106) "
          + "or (<id>.999000081000168101) "
          + "or (<id>.999000111000168106.999000081000168101) "
          + "or ((>>((<id>.999000081000168101) or (<id>.999000111000168106.999000081000168101))) and (^929360071000036103 or ^929360061000036106))) "
          + "and < 260787004";
  private static final String PRODUCT_CONCEPTS_FOR_ATOMIC_EXTRACTION_ECL =
      "(<id> or (>> <id> and (^929360071000036103 or ^929360061000036106))) and < 260787004";
  private final SnowstormClient snowStormApiClient;

  @Autowired
  DeviceService(SnowstormClient snowStormApiClient) {
    this.snowStormApiClient = snowStormApiClient;
  }

  private static SnowstormConceptMiniComponent getMpuuParent(
      String productId, Map<String, String> typeMap, Set<SnowstormConceptComponent> mpuu) {
    Set<SnowstormConceptMiniComponent> mpuuParents =
        filterActiveStatedRelationshipByType(
                getRelationshipsFromAxioms(mpuu.stream().findFirst().orElseThrow()), IS_A)
            .stream()
            .map(SnowstormRelationshipComponent::getTarget)
            .filter(target -> typeMap.get(target != null ? target.getConceptId() : null) == null)
            .collect(Collectors.toSet());

    if (mpuuParents.size() > 1) {
      throw new AtomicDataExtractionProblem(
          "Unexpected number of non MP MPUU parents, found " + mpuu.size(), productId);
    }
    return mpuuParents.iterator().next();
  }

  private static Set<SnowstormConceptComponent> getMpuu(
      SnowstormConceptComponent product,
      String productId,
      Map<String, SnowstormConceptComponent> browserMap,
      Map<String, String> typeMap) {
    Set<SnowstormConceptComponent> mpuu =
        filterActiveStatedRelationshipByType(getRelationshipsFromAxioms(product), IS_A).stream()
            .filter(
                r ->
                    r.getTarget() != null
                        && typeMap.get(r.getTarget().getConceptId()) != null
                        && typeMap.get(r.getTarget().getConceptId()).equals(MPUU_REFSET_ID))
            .map(r -> browserMap.get(r.getTarget().getConceptId()))
            .collect(Collectors.toSet());

    if (mpuu.size() != 1) {
      throw new AtomicDataExtractionProblem("Expected 1 MPUU but found " + mpuu.size(), productId);
    }
    return mpuu;
  }

  private static SnowstormConceptComponent getMp(
      String productId,
      Map<String, SnowstormConceptComponent> browserMap,
      Map<String, String> typeMap,
      Set<SnowstormConceptComponent> mpuu) {
    Set<SnowstormConceptComponent> mp =
        filterActiveStatedRelationshipByType(
                getRelationshipsFromAxioms(mpuu.stream().findFirst().orElseThrow()), IS_A)
            .stream()
            .filter(
                r ->
                    r.getTarget() != null
                        && typeMap.get(r.getTarget().getConceptId()) != null
                        && typeMap.get(r.getTarget().getConceptId()).equals(MP_REFSET_ID))
            .map(r -> browserMap.get(r.getTarget().getConceptId()))
            .collect(Collectors.toSet());

    if (mp.size() != 1) {
      throw new AtomicDataExtractionProblem("Expected 1 MP but found " + mp.size(), productId);
    }
    return mp.iterator().next();
  }

  private static SnowstormConceptMiniComponent getDeviceType(
      String productId,
      Map<String, String> typeMap,
      SnowstormConceptComponent mp,
      DeviceProductDetails productDetails) {
    Set<SnowstormConceptMiniComponent> parents =
        filterActiveStatedRelationshipByType(getRelationshipsFromAxioms(mp), IS_A).stream()
            .map(SnowstormRelationshipComponent::getTarget)
            .filter(target -> target != null && typeMap.get(target.getConceptId()) == null)
            .collect(Collectors.toSet());

    if (parents.isEmpty()) {
      parents =
          filterActiveStatedRelationshipByType(getRelationshipsFromAxioms(mp), IS_A).stream()
              .filter(
                  r ->
                      r.getTarget() != null
                          && typeMap.get(r.getTarget().getConceptId()) != null
                          && typeMap.get(r.getTarget().getConceptId()).equals(MP_REFSET_ID))
              .map(SnowstormRelationshipComponent::getTarget)
              .collect(Collectors.toSet());

      productDetails.setDeviceType(parents.stream().findFirst().orElseThrow());
    }

    if (parents.size() != 1) {
      throw new AtomicDataExtractionProblem(
          "Expected 1 MP parent of MP but found " + parents.size(), productId);
    }
    return parents.iterator().next();
  }

  @Override
  protected SnowstormClient getSnowStormApiClient() {
    return snowStormApiClient;
  }

  @Override
  protected String getPackageAtomicDataEcl() {
    return PACKAGE_CONCEPTS_FOR_ATOMIC_EXTRACTION_DEVICE_ECL;
  }

  @Override
  protected String getProductAtomicDataEcl() {
    return PRODUCT_CONCEPTS_FOR_ATOMIC_EXTRACTION_ECL;
  }

  @Override
  protected DeviceProductDetails populateSpecificProductDetails(
      SnowstormConceptComponent product,
      String productId,
      Map<String, SnowstormConceptComponent> browserMap,
      Map<String, String> typeMap) {

    DeviceProductDetails productDetails = new DeviceProductDetails();

    Set<SnowstormConceptComponent> mpuu = getMpuu(product, productId, browserMap, typeMap);

    productDetails.setSpecificDeviceType(getMpuuParent(productId, typeMap, mpuu));

    SnowstormConceptComponent mp = getMp(productId, browserMap, typeMap, mpuu);

    SnowstormConceptMiniComponent deviceType =
        getDeviceType(productId, typeMap, mp, productDetails);

    productDetails.setDeviceType(deviceType);

    return productDetails;
  }

  @Override
  protected String getType() {
    return "device";
  }

  @Override
  protected String getContainedUnitRelationshipType() {
    return CONTAINS_DEVICE;
  }

  @Override
  protected String getSubpackRelationshipType() {
    return CONTAINS_PACKAGED_DEVICE;
  }
}
