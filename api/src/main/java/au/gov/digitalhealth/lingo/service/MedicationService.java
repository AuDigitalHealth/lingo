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
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CONTAINS_CD;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_BOSS;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_CONCENTRATION_STRENGTH_DENOMINATOR_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_CONCENTRATION_STRENGTH_DENOMINATOR_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_CONCENTRATION_STRENGTH_NUMERATOR_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_CONCENTRATION_STRENGTH_NUMERATOR_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_MANUFACTURED_DOSE_FORM;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRECISE_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRESENTATION_STRENGTH_DENOMINATOR_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRESENTATION_STRENGTH_DENOMINATOR_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRESENTATION_STRENGTH_NUMERATOR_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRESENTATION_STRENGTH_NUMERATOR_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_SUPPLIER;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_UNIT_OF_PRESENTATION;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.IS_A;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.filterActiveInferredRelationshipByType;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.filterActiveStatedRelationshipByType;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getActiveRelationshipsInRoleGroup;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getRelationshipsFromAxioms;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleActiveBigDecimal;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleActiveTarget;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleOptionalActiveBigDecimal;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleOptionalActiveTarget;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.inferredRelationshipOfTypeExists;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.relationshipOfTypeExists;

import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelType;
import au.gov.digitalhealth.lingo.exception.AtomicDataExtractionProblem;
import au.gov.digitalhealth.lingo.product.details.Ingredient;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.Quantity;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty;
import au.gov.digitalhealth.lingo.util.SnomedConstants;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/** Service for product-centric operations */
@Service
@Log
public class MedicationService extends AtomicDataService<MedicationProductDetails> {
  private final SnowstormClient snowStormApiClient;
  private final Models models;

  @Autowired
  MedicationService(SnowstormClient snowStormApiClient, Models models) {
    this.snowStormApiClient = snowStormApiClient;
    this.models = models;
  }

  private static Ingredient getIngredient(
      Integer groupId,
      Set<SnowstormRelationship> productRelationships,
      Map<Integer, ActivePreciseIngredient> preciseActiveInredientMap,
      ModelConfiguration modelConfiguration) {
    Set<SnowstormRelationship> ingredientRoleGroup =
        getActiveRelationshipsInRoleGroup(groupId, productRelationships);

    Ingredient ingredient = new Ingredient();
    ingredient.setActiveIngredient(preciseActiveInredientMap.get(groupId).getActiveIngredient());
    ingredient.setPreciseIngredient(preciseActiveInredientMap.get(groupId).getPreciseIngredient());

    ingredient.setBasisOfStrengthSubstance(
        getSingleOptionalActiveTarget(ingredientRoleGroup, HAS_BOSS.getValue()));
    if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
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
                getSingleActiveTarget(
                    ingredientRoleGroup, CONCENTRATION_STRENGTH_UNIT.getValue())));
      }
    } else {
      if (relationshipOfTypeExists(
          ingredientRoleGroup, HAS_PRESENTATION_STRENGTH_NUMERATOR_VALUE.getValue())) {
        ingredient.setPresentationStrengthNumerator(
            new Quantity(
                getSingleActiveBigDecimal(
                    ingredientRoleGroup, HAS_PRESENTATION_STRENGTH_NUMERATOR_VALUE.getValue()),
                getSingleActiveTarget(
                    ingredientRoleGroup, HAS_PRESENTATION_STRENGTH_NUMERATOR_UNIT.getValue())));
        ingredient.setPresentationStrengthDenominator(
            new Quantity(
                getSingleActiveBigDecimal(
                    ingredientRoleGroup, HAS_PRESENTATION_STRENGTH_DENOMINATOR_VALUE.getValue()),
                getSingleActiveTarget(
                    ingredientRoleGroup, HAS_PRESENTATION_STRENGTH_DENOMINATOR_UNIT.getValue())));
      }
      if (relationshipOfTypeExists(
          ingredientRoleGroup, HAS_CONCENTRATION_STRENGTH_NUMERATOR_VALUE.getValue())) {
        ingredient.setConcentrationStrengthNumerator(
            new Quantity(
                getSingleActiveBigDecimal(
                    ingredientRoleGroup, HAS_CONCENTRATION_STRENGTH_NUMERATOR_VALUE.getValue()),
                getSingleActiveTarget(
                    ingredientRoleGroup, HAS_CONCENTRATION_STRENGTH_NUMERATOR_UNIT.getValue())));
        ingredient.setConcentrationStrengthDenominator(
            new Quantity(
                getSingleActiveBigDecimal(
                    ingredientRoleGroup, HAS_CONCENTRATION_STRENGTH_DENOMINATOR_VALUE.getValue()),
                getSingleActiveTarget(
                    ingredientRoleGroup, HAS_CONCENTRATION_STRENGTH_DENOMINATOR_UNIT.getValue())));
      }
    }
    return ingredient;
  }

  private static void populateDoseForm(
      String productId,
      Map<String, SnowstormConcept> browserMap,
      Map<String, String> typeMap,
      ModelConfiguration modelConfiguration,
      SnowstormConcept product,
      MedicationProductDetails productDetails) {

    Set<SnowstormConcept> mpuu;

    Set<SnowstormRelationship> productRelationships = getRelationshipsFromAxioms(product);

    if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
      mpuu =
          filterActiveStatedRelationshipByType(productRelationships, IS_A.getValue()).stream()
              .filter(
                  r ->
                      r.getTarget() != null
                          && typeMap.get(r.getTarget().getConceptId()) != null
                          && typeMap
                              .get(r.getTarget().getConceptId())
                              .equals(
                                  modelConfiguration.getReferenceSetForModelLevelType(
                                      ModelLevelType.CLINICAL_DRUG)))
              .map(r -> browserMap.get(r.getTarget().getConceptId()))
              .collect(Collectors.toSet());
    } else {
      // TODO working around reference set absence
      mpuu =
          filterActiveInferredRelationshipByType(product.getRelationships(), IS_A.getValue())
              .stream()
              .filter(
                  r ->
                      r.getTarget() != null
                          && browserMap.containsKey(r.getTarget().getConceptId())
                          && browserMap
                              .get(r.getTarget().getConceptId())
                              .getRelationships()
                              .stream()
                              .anyMatch(
                                  rel ->
                                      Boolean.TRUE.equals(rel.getActive())
                                          && rel.getType()
                                              .getConceptId()
                                              .equals(HAS_MANUFACTURED_DOSE_FORM.getValue())))
              .map(r -> browserMap.get(r.getTarget().getConceptId()))
              .collect(Collectors.toSet());
    }

    if (mpuu.size() != 1) {
      throw new AtomicDataExtractionProblem(
          "Expected 1 Clinical Drug level concept but found " + mpuu.size(), productId);
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

  private void addToMap(
      SnowstormRelationship r, Map<Integer, ActivePreciseIngredient> preciseActiveInredientMap) {
    ActivePreciseIngredient activePreciseIngredient = preciseActiveInredientMap.get(r.getGroupId());
    if (activePreciseIngredient == null) {
      if (r.getTypeId().equals(HAS_ACTIVE_INGREDIENT.getValue())) {
        activePreciseIngredient = new ActivePreciseIngredient(r.getTarget(), null);
      } else if (r.getTypeId().equals(HAS_PRECISE_ACTIVE_INGREDIENT.getValue())) {
        activePreciseIngredient = new ActivePreciseIngredient(null, r.getTarget());
      } else {
        throw new AtomicDataExtractionProblem(
            "Unexpected relationship type " + r.getTypeId() + " in group " + r.getGroupId(),
            r.getGroupId().toString());
      }
    } else {
      if (SnomedConstants.valueOf(r.getTypeId()) == HAS_ACTIVE_INGREDIENT) {
        activePreciseIngredient.setActiveIngredient(r.getTarget());
      } else if (SnomedConstants.valueOf(r.getTypeId()) == HAS_PRECISE_ACTIVE_INGREDIENT) {
        activePreciseIngredient.setPreciseIngredient(r.getTarget());
      }
    }
    preciseActiveInredientMap.put(r.getGroupId(), activePreciseIngredient);
  }

  @Override
  protected SnowstormClient getSnowStormApiClient() {
    return snowStormApiClient;
  }

  @Override
  protected String getPackageAtomicDataEcl(ModelConfiguration modelConfiguration) {
    return modelConfiguration.getMedicationPackageDataExtractionEcl();
  }

  @Override
  protected String getProductAtomicDataEcl(ModelConfiguration modelConfiguration) {
    return modelConfiguration.getMedicationProductDataExtractionEcl();
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
      String branch,
      SnowstormConcept product,
      String productId,
      Map<String, SnowstormConcept> browserMap,
      Map<String, String> typeMap,
      ModelConfiguration modelConfiguration) {

    MedicationProductDetails productDetails = new MedicationProductDetails();

    // product name
    Set<SnowstormRelationship> productRelationships = getRelationshipsFromAxioms(product);

    // manufactured dose form - need to detect generic and specific forms if present
    boolean hasDoseForm =
        relationshipOfTypeExists(productRelationships, HAS_MANUFACTURED_DOSE_FORM.getValue());
    if (hasDoseForm) {
      populateDoseForm(productId, browserMap, typeMap, modelConfiguration, product, productDetails);
    }

    if (modelConfiguration.getModelType().equals(ModelType.AMT)) {
      boolean hasContainerType =
          relationshipOfTypeExists(productRelationships, HAS_CONTAINER_TYPE.getValue());
      if (hasContainerType) {
        productDetails.setContainerType(
            getSingleActiveTarget(productRelationships, HAS_CONTAINER_TYPE.getValue()));
      }

      boolean hasDevice =
          relationshipOfTypeExists(productRelationships, HAS_DEVICE_TYPE.getValue());
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
    } else {
      if (relationshipOfTypeExists(productRelationships, HAS_UNIT_OF_PRESENTATION.getValue())) {
        productDetails.setUnitOfPresentation(
            getSingleActiveTarget(productRelationships, HAS_UNIT_OF_PRESENTATION.getValue()));
      }

      // TODO after migration change to additional relationship
      if (inferredRelationshipOfTypeExists(productRelationships, HAS_SUPPLIER.getValue())) {
        productDetails
            .getNonDefiningProperties()
            .add(
                new NonDefiningProperty(
                    product.getRelationships().stream()
                        .filter(r -> r.getActive())
                        .filter(r -> r.getTypeId().equals(HAS_SUPPLIER))
                        .findFirst()
                        .orElseThrow(),
                    modelConfiguration.getNonDefiningPropertiesByName().get("supplier")));
      }
    }

    populatePackSize(productRelationships, productDetails);

    Set<Integer> ingredientGroups =
        filterActiveStatedRelationshipByType(
                productRelationships,
                HAS_ACTIVE_INGREDIENT.getValue(),
                HAS_PRECISE_ACTIVE_INGREDIENT.getValue())
            .stream()
            .map(SnowstormRelationship::getGroupId)
            .collect(Collectors.toSet());

    final Map<Integer, ActivePreciseIngredient> preciseActiveInredientMap =
        getActivePreciseIngredientMap(
            branch, productId, browserMap, typeMap, modelConfiguration, productRelationships);

    for (Integer group : ingredientGroups) {
      productDetails
          .getActiveIngredients()
          .add(
              getIngredient(
                  group, productRelationships, preciseActiveInredientMap, modelConfiguration));
    }
    return productDetails;
  }

  private Map<Integer, ActivePreciseIngredient> getActivePreciseIngredientMap(
      String branch,
      String productId,
      Map<String, SnowstormConcept> browserMap,
      Map<String, String> typeMap,
      ModelConfiguration modelConfiguration,
      Set<SnowstormRelationship> productRelationships) {
    Map<Integer, ActivePreciseIngredient> preciseActiveInredientMap = new HashMap<>();

    filterActiveStatedRelationshipByType(
            productRelationships,
            HAS_ACTIVE_INGREDIENT.getValue(),
            HAS_PRECISE_ACTIVE_INGREDIENT.getValue())
        .forEach(r -> addToMap(r, preciseActiveInredientMap));

    // find all the entries where active ingredients that are missing
    Map<Integer, ActivePreciseIngredient> missingActiveIngreidents =
        preciseActiveInredientMap.entrySet().stream()
            .filter(entry -> entry.getValue().getActiveIngredient() == null)
            .collect(Collectors.toMap(entry -> entry.getKey(), entry -> entry.getValue()));

    if (!missingActiveIngreidents.isEmpty()) {
      // active ingredients aren't on the branded product, need to look at the clinical drug
      SnowstormConcept clinicalDrug =
          browserMap.get(
              typeMap.get(
                  modelConfiguration
                      .getLevelOfType(ModelLevelType.CLINICAL_DRUG)
                      .getReferenceSetIdentifier()));

      // todo this is working around that some of these VMPs still don't have their reference set
      // added
      if (clinicalDrug == null) {
        Set<SnowstormConcept> clinicalDrugs =
            browserMap.values().stream()
                .filter(c -> c.getFsn().getTerm().endsWith("(clinical drug)"))
                .collect(Collectors.toSet());

        if (clinicalDrugs.size() == 1) {
          clinicalDrug = clinicalDrugs.iterator().next();
        } else {
          Set<String> productParents =
              browserMap
                  .get(productRelationships.iterator().next().getSourceId())
                  .getRelationships()
                  .stream()
                  .filter(r -> r.getActive() && r.getTypeId().equals(IS_A.getValue()))
                  .map(r -> r.getTarget().getConceptId())
                  .collect(Collectors.toSet());
          Set<SnowstormConcept> candidtateClinicalDrugs =
              clinicalDrugs.stream()
                  .filter(cd -> productParents.contains(cd.getConceptId()))
                  .collect(Collectors.toSet());
          if (candidtateClinicalDrugs.size() == 1) {
            clinicalDrug = candidtateClinicalDrugs.iterator().next();
          } else {
            throw new AtomicDataExtractionProblem(
                "Expected 1 Clinical Drug but found "
                    + candidtateClinicalDrugs.size()
                    + " canidates were "
                    + candidtateClinicalDrugs.stream()
                        .map(c -> c.getConceptId())
                        .collect(Collectors.joining()),
                productId);
          }
        }

        log.warning(
            "Clinical drug not in reference set, using "
                + clinicalDrug.getConceptId()
                + "|"
                + clinicalDrug.getFsn().getTerm()
                + "|");
      }

      // get the set of target active ingredients
      // todo shouldn't need to get PRECISE_ACTIVE_INGREDIENT here if NMPC content is migrated
      // properly
      Map<String, SnowstormConceptMini> activeIngredients =
          filterActiveStatedRelationshipByType(
                  getRelationshipsFromAxioms(clinicalDrug),
                  HAS_ACTIVE_INGREDIENT.getValue(),
                  HAS_PRECISE_ACTIVE_INGREDIENT.getValue())
              .stream()
              .collect(Collectors.toMap(r -> r.getTarget().getConceptId(), r -> r.getTarget()));

      Set<SnowstormRelationship> clinicalDrugPreciseIngredients =
          filterActiveStatedRelationshipByType(
              getRelationshipsFromAxioms(clinicalDrug), HAS_PRECISE_ACTIVE_INGREDIENT.getValue());

      if (!clinicalDrugPreciseIngredients.isEmpty()) {
        log.warning(
            "Clinical drug "
                + clinicalDrug.getConceptId()
                + "|"
                + clinicalDrug.getFsn().getTerm()
                + "| has "
                + clinicalDrugPreciseIngredients.size()
                + " precise ingredients, expected 0");
      }

      missingActiveIngreidents.forEach(
          (key, value) -> {
            SnowstormConceptMini activeIngredient;
            if (activeIngredients.containsKey(value.getPreciseIngredient().getConceptId())) {
              activeIngredient = activeIngredients.get(value.getPreciseIngredient().getConceptId());
            } else {
              Set<SnowstormConceptMini> candidateIngredients =
                  snowStormApiClient
                      .getConceptsIdsFromEcl(
                          branch,
                          ">><id> OR (>><id>.738774007) OR (>><id>.738774007.738774007) OR (>><id>.738774007.738774007.738774007)",
                          Long.parseLong(value.getPreciseIngredient().getConceptId()),
                          0,
                          1000,
                          modelConfiguration.isExecuteEclAsStated())
                      .stream()
                      .filter(activeIngredients::containsKey)
                      .map(activeIngredients::get)
                      .collect(Collectors.toSet());
              if (candidateIngredients.size() != 1) {
                throw new AtomicDataExtractionProblem(
                    "Expected 1 active ingredient for precise ingredient "
                        + value.getPreciseIngredient().getConceptId()
                        + " but found "
                        + candidateIngredients.stream()
                            .map(SnowstormConceptMini::getConceptId)
                            .collect(Collectors.joining(",")),
                    productId);
              }
              activeIngredient = candidateIngredients.iterator().next();
            }
            preciseActiveInredientMap.get(key).setActiveIngredient(activeIngredient);
          });
    }
    return preciseActiveInredientMap;
  }

  @Override
  protected String getType() {
    return "medication";
  }

  @Data
  @AllArgsConstructor
  class ActivePreciseIngredient {
    SnowstormConceptMini activeIngredient;
    SnowstormConceptMini preciseIngredient;
  }
}
