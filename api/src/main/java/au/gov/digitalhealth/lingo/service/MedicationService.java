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

import static au.gov.digitalhealth.lingo.util.AmtConstants.CONCENTRATION_STRENGTH_UNIT;
import static au.gov.digitalhealth.lingo.util.AmtConstants.CONCENTRATION_STRENGTH_VALUE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.CONTAINS_PACKAGED_CD;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_CONTAINER_TYPE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_DEVICE_TYPE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_TOTAL_QUANTITY_UNIT;
import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_TOTAL_QUANTITY_VALUE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.MPUU_REFSET_ID;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CONTAINS_CD;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_BOSS;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_MANUFACTURED_DOSE_FORM;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRECISE_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.IS_A;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.filterActiveStatedRelationshipByType;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getActiveRelationshipsInRoleGroup;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getActiveRelationshipsOfType;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getRelationshipsFromAxioms;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleActiveTarget;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleOptionalActiveBigDecimal;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleOptionalActiveTarget;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.relationshipOfTypeExists;

import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.exception.AtomicDataExtractionProblem;
import au.gov.digitalhealth.lingo.product.details.Ingredient;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.Quantity;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/** Service for product-centric operations */
@Service
@Log
public class MedicationService extends AtomicDataService<MedicationProductDetails> {
  private static final String PACKAGE_CONCEPTS_FOR_ATOMIC_EXTRACTION_ECL =
      "(<id> or (<id>.999000011000168107) "
          + "or (<id>.774160008) "
          + "or (<id>.999000011000168107.774160008) "
          + "or ((>>((<id>.774160008) or (<id>.999000011000168107.774160008))) and (^929360071000036103))) "
          + "and <373873005";
  private static final String PRODUCT_CONCEPTS_FOR_ATOMIC_EXTRACTION_ECL =
      "(<id> or (>> <id> and ^929360071000036103)) and <373873005";
  private final SnowstormClient snowStormApiClient;
  private final Models models;

  @Autowired
  MedicationService(SnowstormClient snowStormApiClient, Models models) {
    this.snowStormApiClient = snowStormApiClient;
    this.models = models;
  }

  private static Ingredient getIngredient(
      SnowstormRelationship ingredientRelationship,
      Set<SnowstormRelationship> productRelationships) {
    Set<SnowstormRelationship> ingredientRoleGroup =
        getActiveRelationshipsInRoleGroup(ingredientRelationship, productRelationships);
    Ingredient ingredient = new Ingredient();
    ingredient.setActiveIngredient(ingredientRelationship.getTarget());
    ingredient.setPreciseIngredient(
        getSingleOptionalActiveTarget(
            ingredientRoleGroup, HAS_PRECISE_ACTIVE_INGREDIENT.getValue()));
    ingredient.setBasisOfStrengthSubstance(
        getSingleOptionalActiveTarget(ingredientRoleGroup, HAS_BOSS.getValue()));
    if (relationshipOfTypeExists(ingredientRoleGroup, HAS_TOTAL_QUANTITY_VALUE.getValue())) {
      ingredient.setTotalQuantity(
          new Quantity(
              getSingleOptionalActiveBigDecimal(
                  ingredientRoleGroup, HAS_TOTAL_QUANTITY_VALUE.getValue()),
              getSingleActiveTarget(ingredientRoleGroup, HAS_TOTAL_QUANTITY_UNIT.getValue())));
    }
    if (relationshipOfTypeExists(ingredientRoleGroup, CONCENTRATION_STRENGTH_VALUE.getValue())) {
      ingredient.setConcentrationStrength(
          new Quantity(
              getSingleOptionalActiveBigDecimal(
                  ingredientRoleGroup, CONCENTRATION_STRENGTH_VALUE.getValue()),
              getSingleActiveTarget(ingredientRoleGroup, CONCENTRATION_STRENGTH_UNIT.getValue())));
    }
    return ingredient;
  }

  private static void populateDoseForm(
      String productId,
      Map<String, SnowstormConcept> browserMap,
      Map<String, String> typeMap,
      Set<SnowstormRelationship> productRelationships,
      MedicationProductDetails productDetails) {
    Set<SnowstormConcept> mpuu =
        filterActiveStatedRelationshipByType(productRelationships, IS_A.getValue()).stream()
            .filter(
                r ->
                    r.getTarget() != null
                        && typeMap.get(r.getTarget().getConceptId()) != null
                        && typeMap
                            .get(r.getTarget().getConceptId())
                            .equals(MPUU_REFSET_ID.getValue()))
            .map(r -> browserMap.get(r.getTarget().getConceptId()))
            .collect(Collectors.toSet());

    if (mpuu.size() != 1) {
      throw new AtomicDataExtractionProblem("Expected 1 MPUU but found " + mpuu.size(), productId);
    }

    SnowstormConceptMini genericDoseForm =
        getSingleActiveTarget(
            getRelationshipsFromAxioms(mpuu.stream().findFirst().orElseThrow()),
            HAS_MANUFACTURED_DOSE_FORM.getValue());

    productDetails.setGenericForm(genericDoseForm);
    SnowstormConceptMini specificDoseForm =
        getSingleActiveTarget(productRelationships, HAS_MANUFACTURED_DOSE_FORM.getValue());
    if (specificDoseForm.getConceptId() != null
        && !specificDoseForm.getConceptId().equals(genericDoseForm.getConceptId())) {
      productDetails.setSpecificForm(specificDoseForm);
    }
    if (relationshipOfTypeExists(productRelationships, HAS_DEVICE_TYPE.getValue())) {
      throw new AtomicDataExtractionProblem(
          "Expected manufactured dose form or device type, product has both", productId);
    }
  }

  private static void populatePackSize(
      Set<SnowstormRelationship> productRelationships, MedicationProductDetails productDetails) {
    if (relationshipOfTypeExists(productRelationships, HAS_PACK_SIZE_UNIT.getValue())) {
      productDetails.setQuantity(
          new Quantity(
              getSingleOptionalActiveBigDecimal(
                  productRelationships, HAS_PACK_SIZE_VALUE.getValue()),
              getSingleActiveTarget(productRelationships, HAS_PACK_SIZE_UNIT.getValue())));
    }
  }

  @Override
  protected SnowstormClient getSnowStormApiClient() {
    return snowStormApiClient;
  }

  @Override
  protected String getPackageAtomicDataEcl() {
    return PACKAGE_CONCEPTS_FOR_ATOMIC_EXTRACTION_ECL;
  }

  @Override
  protected String getProductAtomicDataEcl() {
    return PRODUCT_CONCEPTS_FOR_ATOMIC_EXTRACTION_ECL;
  }

  @Override
  protected String getContainedUnitRelationshipType() {
    return CONTAINS_CD.getValue();
  }

  @Override
  protected String getSubpackRelationshipType() {
    return CONTAINS_PACKAGED_CD.getValue();
  }

  @Override
  protected ModelConfiguration getModelConfiguration(String branch) {
    return models.getModelConfiguration(branch);
  }

  @Override
  protected MedicationProductDetails populateSpecificProductDetails(
      SnowstormConcept product,
      String productId,
      Map<String, SnowstormConcept> browserMap,
      Map<String, String> typeMap) {

    MedicationProductDetails productDetails = new MedicationProductDetails();

    // product name
    Set<SnowstormRelationship> productRelationships = getRelationshipsFromAxioms(product);

    // manufactured dose form - need to detect generic and specific forms if present
    boolean hasDoseForm =
        relationshipOfTypeExists(productRelationships, HAS_MANUFACTURED_DOSE_FORM.getValue());
    if (hasDoseForm) {
      populateDoseForm(productId, browserMap, typeMap, productRelationships, productDetails);
    }

    boolean hasContainerType =
        relationshipOfTypeExists(productRelationships, HAS_CONTAINER_TYPE.getValue());
    if (hasContainerType) {
      productDetails.setContainerType(
          getSingleActiveTarget(productRelationships, HAS_CONTAINER_TYPE.getValue()));
    }

    boolean hasDevice = relationshipOfTypeExists(productRelationships, HAS_DEVICE_TYPE.getValue());
    if (hasDevice) {
      productDetails.setDeviceType(
          getSingleActiveTarget(productRelationships, HAS_DEVICE_TYPE.getValue()));
    }

    if (!hasDoseForm && !hasDevice) {
      throw new AtomicDataExtractionProblem(
          "Expected manufactured dose form or device type, product has neither", productId);
    } else if (hasDoseForm && hasDevice) {
      throw new AtomicDataExtractionProblem(
          "Expected manufactured dose form or device type, product has both", productId);
    } else if (hasDevice && hasContainerType) {
      throw new AtomicDataExtractionProblem(
          "Expected container type or device type, product has both", productId);
    }

    populatePackSize(productRelationships, productDetails);

    Set<SnowstormRelationship> ingredientRelationships =
        getActiveRelationshipsOfType(productRelationships, HAS_ACTIVE_INGREDIENT.getValue());
    for (SnowstormRelationship ingredientRelationship : ingredientRelationships) {
      productDetails
          .getActiveIngredients()
          .add(getIngredient(ingredientRelationship, productRelationships));
    }
    return productDetails;
  }

  @Override
  protected String getType() {
    return "medication";
  }
}
