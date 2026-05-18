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
import java.util.HashSet;
import java.util.Set;

/**
 * Catalogue of the defining attribute types that the authoring tool controls at each model level
 * (i.e. attributes that can appear or be absent based solely on the user's atomic-data input). Used
 * by ECL generation to constrain searches so that concepts carrying user-controllable defining
 * attributes not present in the supplied atomic data are excluded from the candidate set.
 *
 * <p>This deliberately mirrors the (previously hard-coded) negative-filter rules in {@code
 * EclBuilder} plus the NMPC-specific MP-level attributes ({@link
 * SnomedConstants#HAS_TARGET_POPULATION}, {@link SnomedConstants#PLAYS_ROLE}, {@link
 * SnomedConstants#HAS_QUALITATIVE_STRENGTH}) that the original rule set missed. Attributes that
 * are intrinsic to existing AMT/NMPC content but not user-controllable in the atomic-data form
 * (e.g. BOSS, total quantity, presentation strength) are intentionally omitted so candidate
 * concepts carrying them are not over-filtered.
 */
public final class ModelLevelDefiningAttributes {

  private ModelLevelDefiningAttributes() {}

  /**
   * Returns the set of user-controllable defining attribute type SCTIDs that may appear on a
   * concept at the given model level for the given model type. Callers can compare this set to the
   * relationships of a candidate atomic-data shape to determine which attribute types should be
   * added as {@code [0..0] X = *} negative filters (i.e. "must not have this attribute") in a
   * generated ECL query.
   *
   * @param levelType the model level of the concept being matched
   * @param modelType the model variant (AMT, NMPC, ...)
   * @return an immutable set of attribute type SCTIDs; empty for levels with no defining
   *     attributes that the authoring tool drives (e.g. brand name)
   */
  public static Set<String> getDefiningAttributeTypes(
      ModelLevelType levelType, ModelType modelType) {
    if (levelType == null) {
      return Set.of();
    }
    Set<String> attributes = new HashSet<>();

    if (levelType == ModelLevelType.MEDICINAL_PRODUCT
        || levelType == ModelLevelType.MEDICINAL_PRODUCT_ONLY) {
      // MP-level attributes — these distinguish an MP from a clinical drug below it
      attributes.add(HAS_MANUFACTURED_DOSE_FORM.getValue());
      attributes.add(HAS_ACTIVE_INGREDIENT.getValue());
      attributes.add(HAS_PRECISE_ACTIVE_INGREDIENT.getValue());
      attributes.add(COUNT_OF_BASE_ACTIVE_INGREDIENT.getValue());
      if (modelType == ModelType.AMT) {
        attributes.add(COUNT_OF_ACTIVE_INGREDIENT.getValue());
      }
    }

    // User-controllable defining attributes that the NMPC calculation emits at the MP/VTM AND
    // clinical-drug/branded-clinical-drug levels (a VMP/AMP IS_A its VTM and restates the role,
    // target population, and qualitative strength rather than inheriting them implicitly). Adding
    // these to the negative-filter set at all three levels ensures candidate concepts carrying the
    // attribute are excluded when the user has removed it from the atomic data.
    if (modelType == ModelType.NMPC
        && (levelType == ModelLevelType.MEDICINAL_PRODUCT
            || levelType == ModelLevelType.MEDICINAL_PRODUCT_ONLY
            || levelType == ModelLevelType.CLINICAL_DRUG
            || levelType == ModelLevelType.REAL_CLINICAL_DRUG)) {
      attributes.add(PLAYS_ROLE.getValue());
      attributes.add(HAS_TARGET_POPULATION.getValue());
      attributes.add(HAS_QUALITATIVE_STRENGTH.getValue());
    }

    // Level-independent filters previously applied unconditionally in EclBuilder. They mostly
    // serve to discriminate branded vs unbranded and AMT pack-level shapes.
    attributes.add(HAS_PRODUCT_NAME.getValue());
    if (modelType == ModelType.AMT) {
      attributes.add(HAS_CONTAINER_TYPE.getValue());
      attributes.add(HAS_PACK_SIZE_VALUE.getValue());
      attributes.add(HAS_PACK_SIZE_UNIT.getValue());
    }

    return Collections.unmodifiableSet(attributes);
  }
}
