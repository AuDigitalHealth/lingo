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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelType;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ModelLevelDefiningAttributesTest {

  @Test
  void nmpcMpLevelIncludesTargetPopulationAndPlaysRole() {
    Set<LingoConstants> attrs =
        ModelLevelDefiningAttributes.getDefiningAttributeTypes(
            ModelLevelType.MEDICINAL_PRODUCT_ONLY, ModelType.NMPC);

    assertTrue(attrs.contains(SnomedConstants.HAS_TARGET_POPULATION));
    assertTrue(attrs.contains(SnomedConstants.PLAYS_ROLE));
    assertTrue(attrs.contains(SnomedConstants.HAS_QUALITATIVE_STRENGTH));
    assertTrue(attrs.contains(SnomedConstants.HAS_ACTIVE_INGREDIENT));
    assertTrue(attrs.contains(SnomedConstants.HAS_MANUFACTURED_DOSE_FORM));
  }

  @Test
  void amtMpLevelExcludesNmpcSpecificAttributes() {
    Set<LingoConstants> attrs =
        ModelLevelDefiningAttributes.getDefiningAttributeTypes(
            ModelLevelType.MEDICINAL_PRODUCT, ModelType.AMT);

    assertFalse(attrs.contains(SnomedConstants.HAS_TARGET_POPULATION));
    assertFalse(attrs.contains(SnomedConstants.PLAYS_ROLE));
    assertTrue(attrs.contains(SnomedConstants.HAS_ACTIVE_INGREDIENT));
    assertTrue(attrs.contains(SnomedConstants.HAS_MANUFACTURED_DOSE_FORM));
    assertTrue(attrs.contains(SnomedConstants.COUNT_OF_ACTIVE_INGREDIENT));
  }

  @Test
  void nmpcClinicalDrugIncludesUserControllableMpAttributes() {
    Set<LingoConstants> attrs =
        ModelLevelDefiningAttributes.getDefiningAttributeTypes(
            ModelLevelType.CLINICAL_DRUG, ModelType.NMPC);

    // VMP IS_A constraint is supplied separately via the parent node; the MP-defining ingredient
    // and dose-form attributes are not re-added here. But the user-controllable NMPC attributes
    // are restated on the VMP and so must be filterable.
    assertFalse(attrs.contains(SnomedConstants.HAS_MANUFACTURED_DOSE_FORM));
    assertTrue(attrs.contains(SnomedConstants.HAS_TARGET_POPULATION));
    assertTrue(attrs.contains(SnomedConstants.PLAYS_ROLE));
    assertTrue(attrs.contains(SnomedConstants.HAS_QUALITATIVE_STRENGTH));
    assertTrue(attrs.contains(SnomedConstants.HAS_PRODUCT_NAME));
  }

  @Test
  void amtClinicalDrugOmitsNmpcUserAttributes() {
    Set<LingoConstants> attrs =
        ModelLevelDefiningAttributes.getDefiningAttributeTypes(
            ModelLevelType.CLINICAL_DRUG, ModelType.AMT);

    assertFalse(attrs.contains(SnomedConstants.HAS_TARGET_POPULATION));
    assertFalse(attrs.contains(SnomedConstants.PLAYS_ROLE));
    assertTrue(attrs.contains(SnomedConstants.HAS_PRODUCT_NAME));
  }

  @Test
  void amtPackagesIncludePackSizeAndContainerType() {
    Set<LingoConstants> attrs =
        ModelLevelDefiningAttributes.getDefiningAttributeTypes(
            ModelLevelType.PACKAGED_CLINICAL_DRUG, ModelType.AMT);

    assertTrue(attrs.contains(SnomedConstants.HAS_PACK_SIZE_VALUE));
    assertTrue(attrs.contains(SnomedConstants.HAS_PACK_SIZE_UNIT));
    assertTrue(attrs.contains(AmtConstants.HAS_CONTAINER_TYPE));
    assertTrue(attrs.contains(SnomedConstants.HAS_PRODUCT_NAME));
  }

  @Test
  void nmpcPackagesOmitAmtOnlyFilters() {
    Set<LingoConstants> attrs =
        ModelLevelDefiningAttributes.getDefiningAttributeTypes(
            ModelLevelType.PACKAGED_CLINICAL_DRUG, ModelType.NMPC);

    assertFalse(attrs.contains(AmtConstants.HAS_CONTAINER_TYPE));
    assertFalse(attrs.contains(SnomedConstants.HAS_PACK_SIZE_VALUE));
    assertTrue(attrs.contains(SnomedConstants.HAS_PRODUCT_NAME));
  }

  @Test
  void nullLevelReturnsEmptySet() {
    assertEquals(
        Set.of(), ModelLevelDefiningAttributes.getDefiningAttributeTypes(null, ModelType.AMT));
  }

  @Test
  void getDefiningAttributeTypeIdsReturnsSctidStringsForSameSet() {
    Set<LingoConstants> typed =
        ModelLevelDefiningAttributes.getDefiningAttributeTypes(
            ModelLevelType.MEDICINAL_PRODUCT_ONLY, ModelType.NMPC);
    Set<String> ids =
        ModelLevelDefiningAttributes.getDefiningAttributeTypeIds(
            ModelLevelType.MEDICINAL_PRODUCT_ONLY, ModelType.NMPC);

    assertEquals(
        typed.stream().map(LingoConstants::getValue).collect(java.util.stream.Collectors.toSet()),
        ids);
  }
}
