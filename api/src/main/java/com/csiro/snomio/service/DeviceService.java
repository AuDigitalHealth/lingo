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
  private static final String PRODUCT_CONCEPTS_FOR_ATOMIC_EXTRACTION_ECL =
      "(<id> or (<id>.999000111000168106) "
          + "or (<id>.999000081000168101) "
          + "or (<id>.999000111000168106.999000081000168101) "
          + "or ((>>((<id>.999000081000168101) or (<id>.999000111000168106.999000081000168101))) and (^929360071000036103 or ^929360061000036106))) "
          + "and < 260787004";
  private final SnowstormClient snowStormApiClient;

  @Autowired
  DeviceService(SnowstormClient snowStormApiClient) {
    this.snowStormApiClient = snowStormApiClient;
  }

  @Override
  protected SnowstormClient getSnowStormApiClient() {
    return snowStormApiClient;
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
      Map<String, String> typeMap,
      SnowstormRelationshipComponent subProductRelationship) {

    DeviceProductDetails productDetails = new DeviceProductDetails();

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
    } else {
      if (mpuuParents.size() == 1) {
        productDetails.setSpecificDeviceType(mpuuParents.stream().findFirst().orElseThrow());
      }
    }

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

    Set<SnowstormConceptMiniComponent> parents =
        filterActiveStatedRelationshipByType(
                getRelationshipsFromAxioms(mp.stream().findFirst().orElseThrow()), IS_A)
            .stream()
            .map(SnowstormRelationshipComponent::getTarget)
            .filter(target -> target != null && typeMap.get(target.getConceptId()) == null)
            .collect(Collectors.toSet());

    if (parents.isEmpty()) {
      parents =
          filterActiveStatedRelationshipByType(
                  getRelationshipsFromAxioms(mp.stream().findFirst().orElseThrow()), IS_A)
              .stream()
              .filter(
                  r ->
                      r.getTarget() != null
                          && typeMap.get(r.getTarget().getConceptId()) != null
                          && typeMap.get(r.getTarget().getConceptId()).equals(MP_REFSET_ID))
              .map(SnowstormRelationshipComponent::getTarget)
              .collect(Collectors.toSet());

      if (parents.size() != 1) {
        throw new AtomicDataExtractionProblem(
            "Expected 1 MP parent of MP but found " + parents.size(), productId);
      }

      productDetails.setDeviceType(parents.stream().findFirst().orElseThrow());
    } else if (parents.size() > 1) {
      throw new AtomicDataExtractionProblem(
          "Expected 1 parent but found " + parents.size(), productId);
    }

    productDetails.setDeviceType(parents.stream().findFirst().orElseThrow());

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
