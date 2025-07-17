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
import static au.gov.digitalhealth.lingo.util.AmtConstants.CONTAINS_PACKAGED_DEVICE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.IS_A;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.filterActiveStatedRelationshipByType;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getRelationshipsFromAxioms;

import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.exception.AtomicDataExtractionProblem;
import au.gov.digitalhealth.lingo.product.details.DeviceProductDetails;
import au.gov.digitalhealth.lingo.service.fhir.FhirClient;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/** Service for product-centric operations */
@Service
public class DeviceService extends AtomicDataService<DeviceProductDetails> {
  private final SnowstormClient snowStormApiClient;
  private final Models models;
  private final FhirClient fhirClient;

  DeviceService(SnowstormClient snowStormApiClient, Models models, FhirClient fhirClient) {
    this.snowStormApiClient = snowStormApiClient;
    this.models = models;
    this.fhirClient = fhirClient;
  }

  private static SnowstormConceptMini getLeafUnbrandedProduct(
      SnowstormConcept product,
      String productId,
      Map<String, String> typeMap,
      ModelConfiguration modelConfiguration) {
    Set<SnowstormConceptMini> mpuu =
        filterActiveStatedRelationshipByType(getRelationshipsFromAxioms(product), IS_A.getValue())
            .stream()
            .filter(
                r ->
                    r.getTarget() != null
                        && typeMap.get(r.getTarget().getConceptId()) != null
                        && typeMap
                            .get(r.getTarget().getConceptId())
                            .equals(
                                modelConfiguration
                                    .getLeafUnbrandedProductModelLevel()
                                    .getReferenceSetIdentifier()))
            .map(SnowstormRelationship::getTarget)
            .collect(Collectors.toSet());

    if (mpuu.size() != 1) {
      throw new AtomicDataExtractionProblem("Expected 1 MPUU but found " + mpuu.size(), productId);
    }
    return mpuu.iterator().next();
  }

  private SnowstormConceptMini getRootUnbrandedProduct(
      String branch,
      String productId,
      Map<String, SnowstormConcept> browserMap,
      Map<String, String> typeMap,
      SnowstormConceptMini mpuu,
      ModelConfiguration modelConfiguration) {

    // if there is only one MP then it is the root type
    String rootRefsetId =
        modelConfiguration.getRootUnbrandedProductModelLevel().getReferenceSetIdentifier();

    Optional<Entry<String, String>> rootTypeEntry =
        typeMap.entrySet().stream().filter(e -> rootRefsetId.equals(e.getValue())).findFirst();

    if (typeMap.entrySet().stream().filter(e -> rootRefsetId.equals(e.getValue())).count() == 1) {
      return SnowstormDtoUtil.toSnowstormConceptMini(
          browserMap.get(
              rootTypeEntry
                  .map(Map.Entry::getKey)
                  .orElseThrow(
                      () -> new AtomicDataExtractionProblem("Root type not found", productId))));
    }

    // otherwise we need to find the MP that is the root type first try the stated relationships
    Set<SnowstormConceptMini> mp =
        filterActiveStatedRelationshipByType(
                getRelationshipsFromAxioms(browserMap.get(mpuu.getConceptId())), IS_A.getValue())
            .stream()
            .filter(
                r ->
                    r.getTarget() != null
                        && typeMap.get(r.getTarget().getConceptId()) != null
                        && typeMap
                            .get(r.getTarget().getConceptId())
                            .equals(
                                modelConfiguration
                                    .getRootUnbrandedProductModelLevel()
                                    .getReferenceSetIdentifier()))
            .map(SnowstormRelationship::getTarget)
            .collect(Collectors.toSet());

    if (mp.size() == 1) {
      return mp.iterator().next();
    }

    return snowStormApiClient.getConceptFromEcl(
        branch,
        modelConfiguration.getRootUnbrandedProductModelLevel().getProductModelEcl(),
        Long.parseLong(mpuu.getConceptId()),
        modelConfiguration.isExecuteEclAsStated());
  }

  @Override
  protected FhirClient getFhirClient() {
    return fhirClient;
  }

  @Override
  protected SnowstormClient getSnowStormApiClient() {
    return snowStormApiClient;
  }

  @Override
  protected String getPackageAtomicDataEcl(ModelConfiguration modelConfiguration) {
    return modelConfiguration.getDevicePackageDataExtractionEcl();
  }

  @Override
  protected String getProductAtomicDataEcl(ModelConfiguration modelConfiguration) {
    return modelConfiguration.getDeviceProductDataExtractionEcl();
  }

  @Override
  protected DeviceProductDetails populateSpecificProductDetails(
      String branch,
      SnowstormConcept product,
      String productId,
      Map<String, SnowstormConcept> browserMap,
      Map<String, String> typeMap,
      ModelConfiguration modelConfiguration) {

    DeviceProductDetails productDetails = new DeviceProductDetails();

    productDetails.setSpecificDeviceType(
        getLeafUnbrandedProduct(product, productId, typeMap, modelConfiguration));

    productDetails.setDeviceType(
        getRootUnbrandedProduct(
            branch,
            productId,
            browserMap,
            typeMap,
            productDetails.getSpecificDeviceType(),
            modelConfiguration));

    return productDetails;
  }

  @Override
  protected String getType() {
    return "device";
  }

  @Override
  protected String getContainedUnitRelationshipType() {
    return CONTAINS_DEVICE.getValue();
  }

  @Override
  protected String getSubpackRelationshipType() {
    return CONTAINS_PACKAGED_DEVICE.getValue();
  }

  @Override
  protected ModelConfiguration getModelConfiguration(String branch) {
    return models.getModelConfiguration(branch);
  }
}
