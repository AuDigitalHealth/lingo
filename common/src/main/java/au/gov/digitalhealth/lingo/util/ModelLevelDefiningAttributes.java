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
package au.gov.digitalhealth.lingo.util;

import static au.gov.digitalhealth.lingo.util.AmtConstants.HAS_CONTAINER_TYPE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.COUNT_OF_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.COUNT_OF_BASE_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_MANUFACTURED_DOSE_FORM;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_UNIT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PACK_SIZE_VALUE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRECISE_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRODUCT_NAME;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_QUALITATIVE_STRENGTH;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_TARGET_POPULATION;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.PLAYS_ROLE;

import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelType;
import java.util.Collections;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Catalogue of the user-controllable defining attribute types that may appear on a concept at each
 * model level. Used by ECL generation to constrain searches so that concepts carrying additional
 * defining attributes not present in the supplied atomic data are excluded from the candidate set.
 *
 * <p>This deliberately mirrors the (previously hard-coded) negative-filter rules in {@code
 * EclBuilder} plus the NMPC-specific MP-level attributes ({@link
 * SnomedConstants#HAS_TARGET_POPULATION}, {@link SnomedConstants#PLAYS_ROLE}, {@link
 * SnomedConstants#HAS_QUALITATIVE_STRENGTH}) that the original rule set missed. Attributes that
 * are intrinsic to existing AMT/NMPC content but not user-controllable in the atomic-data form
 * (e.g. BOSS, total quantity, presentation strength) are intentionally omitted so candidate
 * concepts carrying them are not over-filtered.
 *
 * <p><strong>Sync requirement:</strong> when {@code MedicationProductCalculationService}'s
 * {@code createMpRelationships}, {@code createClinicalDrugRelationships}, or {@code
 * createPackagedClinicalDrugRelationships} starts emitting a new defining attribute that the user
 * controls (i.e. can be present-or-absent based on atomic-data input), add it here too — otherwise
 * candidates carrying that attribute will silently match when the user has removed it.
 */
public final class ModelLevelDefiningAttributes {

  private ModelLevelDefiningAttributes() {}

  /**
   * Returns the set of user-controllable defining attribute types that may appear on a concept at
   * the given model level for the given model type. Callers can compare this set to the
   * relationships of a candidate atomic-data shape to determine which attribute types should be
   * added as {@code [0..0] X = *} or {@code [0..0] X != value} negative filters in a generated
   * ECL query.
   *
   * @param levelType the model level of the concept being matched
   * @param modelType the model variant (AMT, NMPC, ...)
   * @return an immutable set of attribute type constants; empty for levels with no defining
   *     attributes that the authoring tool drives (e.g. brand name)
   */
  public static Set<LingoConstants> getDefiningAttributeTypes(
      ModelLevelType levelType, ModelType modelType) {
    if (levelType == null) {
      return Set.of();
    }
    Set<LingoConstants> attributes = new HashSet<>(levelSpecificAttributes(levelType, modelType));
    attributes.addAll(nmpcUserControllableAttributes(levelType, modelType));
    attributes.addAll(modelTypeWideAttributes(modelType));
    return Collections.unmodifiableSet(attributes);
  }

  /**
   * Convenience accessor that returns the same set as {@link
   * #getDefiningAttributeTypes(ModelLevelType, ModelType)} but as SCTID strings, for direct use
   * in ECL fragment construction.
   */
  public static Set<String> getDefiningAttributeTypeIds(
      ModelLevelType levelType, ModelType modelType) {
    return getDefiningAttributeTypes(levelType, modelType).stream()
        .map(LingoConstants::getValue)
        .collect(Collectors.toUnmodifiableSet());
  }

  private static Set<LingoConstants> levelSpecificAttributes(
      ModelLevelType levelType, ModelType modelType) {
    return switch (levelType) {
      case MEDICINAL_PRODUCT, MEDICINAL_PRODUCT_ONLY -> {
        Set<LingoConstants> attrs =
            new HashSet<>(
                Set.of(
                    HAS_MANUFACTURED_DOSE_FORM,
                    HAS_ACTIVE_INGREDIENT,
                    HAS_PRECISE_ACTIVE_INGREDIENT,
                    COUNT_OF_BASE_ACTIVE_INGREDIENT));
        if (modelType == ModelType.AMT) {
          attrs.add(COUNT_OF_ACTIVE_INGREDIENT);
        }
        yield attrs;
      }
      case CLINICAL_DRUG,
          REAL_CLINICAL_DRUG,
          PACKAGED_CLINICAL_DRUG,
          REAL_PACKAGED_CLINICAL_DRUG,
          REAL_CONTAINERIZED_PACKAGED_CLINICAL_DRUG,
          REAL_MEDICINAL_PRODUCT,
          PRODUCT_NAME -> Set.of();
    };
    // Note: the switch is exhaustive over ModelLevelType — when a new level is added the compiler
    // will require it to be handled here.
  }

  private static Set<LingoConstants> nmpcUserControllableAttributes(
      ModelLevelType levelType, ModelType modelType) {
    // NMPC restates the MP-level user attributes (plays role, target population, qualitative
    // strength) on the VMP and AMP — see createClinicalDrugRelationships for VaccineProductDetails.
    if (modelType != ModelType.NMPC) {
      return Set.of();
    }
    Set<ModelLevelType> nmpcUserAttrLevels =
        EnumSet.of(
            ModelLevelType.MEDICINAL_PRODUCT,
            ModelLevelType.MEDICINAL_PRODUCT_ONLY,
            ModelLevelType.CLINICAL_DRUG,
            ModelLevelType.REAL_CLINICAL_DRUG);
    if (!nmpcUserAttrLevels.contains(levelType)) {
      return Set.of();
    }
    return Set.of(PLAYS_ROLE, HAS_TARGET_POPULATION, HAS_QUALITATIVE_STRENGTH);
  }

  private static Set<LingoConstants> modelTypeWideAttributes(ModelType modelType) {
    Set<LingoConstants> attrs = new HashSet<>();
    attrs.add(HAS_PRODUCT_NAME);
    if (modelType == ModelType.AMT) {
      attrs.add(HAS_CONTAINER_TYPE);
      attrs.add(HAS_PACK_SIZE_VALUE);
      attrs.add(HAS_PACK_SIZE_UNIT);
    }
    return attrs;
  }
}
