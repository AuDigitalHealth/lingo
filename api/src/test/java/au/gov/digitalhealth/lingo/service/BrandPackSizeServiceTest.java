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

import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRODUCT_NAME;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.IS_A;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MEDICINAL_PRODUCT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.STATED_RELATIONSHIP;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.STATED_RELATIONSHUIP_CHARACTRISTIC_TYPE;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSnowstormRelationship;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.toSnowstormConceptMini;
import static org.assertj.core.api.Assertions.assertThat;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.util.NmpcConstants;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for BrandPackSizeService#buildNewBrandedProductRelationships covering the IS_A
 * preservation/replacement contract that fix #1755 is built on.
 *
 * <p>Each test exercises a specific scenario from the spec attached to the issue (see {@code
 * .ai/spec.md}) so the regression behaviour is locked in.
 */
class BrandPackSizeServiceTest {

  private static final String MODULE_ID = "900062011000036108";

  // Source/template branded product ATM concept being cloned from
  private static final String SOURCE_TP_CONCEPT_ID = "934531000220104";
  // The new brand the user is creating (e.g. "Dougal Brandy")
  private static final String NEW_BRAND_CONCEPT_ID = "919341000220105";
  private static final String NEW_BRAND_TERM = "Dougal Brandy (brand) (product name)";

  // Existing branded product ATM concept ids being replaced (at non-top branded levels these
  // would be e.g. the TPP/CTPP being replaced by the new brand). For the top branded level we
  // pass an empty set because there is no other branded ancestor in the source product summary.
  private static final String EXISTING_BRANDED_TPP_ID = "955511000220105";

  // NMPC nutritional type-specific MP parent that must be preserved (e.g. "NMPC Oral Nutritional
  // product" 681011000220107).
  private static final String NMPC_NUTRITIONAL_MP_ID = "681011000220107";
  private static final String NMPC_NUTRITIONAL_MP_TERM = "NMPC Oral Nutritional product (product)";

  // An arbitrary "Has product name" target on the source axiom that must be retargeted to the
  // new brand.
  private static final String SOURCE_BRAND_ID = "760151000220109";
  private static final String SOURCE_BRAND_TERM = "Ensure TwoCal (brand) (product name)";

  private static SnowstormConceptMini newBrandMini() {
    return toSnowstormConceptMini(NEW_BRAND_CONCEPT_ID, NEW_BRAND_TERM);
  }

  private static SnowstormRelationship isA(String destinationId, String destinationTerm) {
    return getSnowstormRelationship(
        IS_A.getValue(),
        IS_A.getLabel(),
        toSnowstormConceptMini(destinationId, destinationTerm),
        0,
        STATED_RELATIONSHIP,
        MODULE_ID);
  }

  private static SnowstormRelationship hasProductName(
      String destinationId, String destinationTerm) {
    return getSnowstormRelationship(
        HAS_PRODUCT_NAME.getValue(),
        HAS_PRODUCT_NAME.getLabel(),
        toSnowstormConceptMini(destinationId, destinationTerm),
        0,
        STATED_RELATIONSHIP,
        MODULE_ID);
  }

  private static Set<SnowstormRelationship> filterIsA(Set<SnowstormRelationship> rels) {
    return rels.stream()
        .filter(r -> IS_A.getValue().equals(r.getTypeId()))
        .collect(Collectors.toSet());
  }

  private static Set<String> isADestinationIds(Set<SnowstormRelationship> rels) {
    return filterIsA(rels).stream()
        .map(SnowstormRelationship::getDestinationId)
        .collect(Collectors.toSet());
  }

  /**
   * Issue #1755 / image 1 vs image 4: when cloning an NMPC nutritional ATM (real medicinal product)
   * to a new brand, the type-specific IS_A (e.g. "NMPC Oral Nutritional product") must be preserved
   * AND the SNOMED MEDICINAL_PRODUCT root must remain the only top-level IS_A. No
   * VIRTUAL_MEDICINAL_PRODUCT must appear at the branded level.
   */
  @Test
  void preservesNmpcNutritionalTypeSpecificIsAAndAddsMedicinalProductRoot() {
    Set<SnowstormRelationship> sourceRels = new HashSet<>();
    sourceRels.add(isA(MEDICINAL_PRODUCT.getValue(), MEDICINAL_PRODUCT.getLabel()));
    sourceRels.add(isA(NMPC_NUTRITIONAL_MP_ID, NMPC_NUTRITIONAL_MP_TERM));
    sourceRels.add(hasProductName(SOURCE_BRAND_ID, SOURCE_BRAND_TERM));

    Set<SnowstormRelationship> result =
        BrandPackSizeService.buildNewBrandedProductRelationships(
            sourceRels, newBrandMini(), ModelLevelType.REAL_MEDICINAL_PRODUCT, Set.of(), MODULE_ID);

    assertThat(isADestinationIds(result))
        .as("Both SNOMED MEDICINAL_PRODUCT root and NMPC nutritional MP IS_A must be preserved")
        .containsExactlyInAnyOrder(MEDICINAL_PRODUCT.getValue(), NMPC_NUTRITIONAL_MP_ID);

    assertThat(isADestinationIds(result))
        .as("Must not introduce a VIRTUAL_MEDICINAL_PRODUCT IS_A at the branded MP level")
        .doesNotContain(NmpcConstants.VIRTUAL_MEDICINAL_PRODUCT.getValue());

    SnowstormRelationship hpn =
        result.stream()
            .filter(r -> HAS_PRODUCT_NAME.getValue().equals(r.getTypeId()))
            .findFirst()
            .orElseThrow();
    assertThat(hpn.getDestinationId()).isEqualTo(NEW_BRAND_CONCEPT_ID);
    assertThat(hpn.getTarget().getConceptId()).isEqualTo(NEW_BRAND_CONCEPT_ID);
  }

  /**
   * AMT regression: source has IS_A MEDICINAL_PRODUCT only at the branded MP level. The new branded
   * concept must keep IS_A MEDICINAL_PRODUCT and have no other IS_A parents. Pre-fix this level
   * would have added IS_A VIRTUAL_MEDICINAL_PRODUCT for NMPC; for AMT it added MEDICINAL_PRODUCT -
   * this test pins the AMT root behaviour.
   */
  @Test
  void amtTopBrandedLevelKeepsMedicinalProductRootOnly() {
    Set<SnowstormRelationship> sourceRels = new HashSet<>();
    sourceRels.add(isA(MEDICINAL_PRODUCT.getValue(), MEDICINAL_PRODUCT.getLabel()));
    sourceRels.add(hasProductName(SOURCE_BRAND_ID, SOURCE_BRAND_TERM));

    Set<SnowstormRelationship> result =
        BrandPackSizeService.buildNewBrandedProductRelationships(
            sourceRels, newBrandMini(), ModelLevelType.REAL_MEDICINAL_PRODUCT, Set.of(), MODULE_ID);

    assertThat(isADestinationIds(result)).containsExactly(MEDICINAL_PRODUCT.getValue());
    assertThat(isADestinationIds(result))
        .doesNotContain(NmpcConstants.VIRTUAL_MEDICINAL_PRODUCT.getValue());
  }

  /**
   * Where the source axiom is missing the SNOMED MEDICINAL_PRODUCT root IS_A but does carry a
   * type-specific NMPC parent (e.g. legacy data), the helper must inject MEDICINAL_PRODUCT root
   * because the regular create-product flow always emits it at the top branded level.
   */
  @Test
  void addsMedicinalProductRootWhenMissingFromSource() {
    Set<SnowstormRelationship> sourceRels = new HashSet<>();
    sourceRels.add(isA(NMPC_NUTRITIONAL_MP_ID, NMPC_NUTRITIONAL_MP_TERM));
    sourceRels.add(hasProductName(SOURCE_BRAND_ID, SOURCE_BRAND_TERM));

    Set<SnowstormRelationship> result =
        BrandPackSizeService.buildNewBrandedProductRelationships(
            sourceRels, newBrandMini(), ModelLevelType.REAL_MEDICINAL_PRODUCT, Set.of(), MODULE_ID);

    assertThat(isADestinationIds(result))
        .containsExactlyInAnyOrder(MEDICINAL_PRODUCT.getValue(), NMPC_NUTRITIONAL_MP_ID);
  }

  /**
   * When the source axiom carries IS_A relationships pointing at other branded product concepts
   * being replaced by addEdgesAndNodes (the existingBrandedProductConceptIds set), those specific
   * IS_A relationships must be stripped so the orchestration code can replace them with IS_A
   * relationships to the newly minted branded ancestors.
   */
  @Test
  void stripsIsARelationshipsToBrandedProductsBeingReplaced() {
    Set<SnowstormRelationship> sourceRels = new HashSet<>();
    sourceRels.add(isA(EXISTING_BRANDED_TPP_ID, "Some other branded ancestor (product)"));
    sourceRels.add(isA(NMPC_NUTRITIONAL_MP_ID, NMPC_NUTRITIONAL_MP_TERM));
    sourceRels.add(isA(MEDICINAL_PRODUCT.getValue(), MEDICINAL_PRODUCT.getLabel()));
    sourceRels.add(hasProductName(SOURCE_BRAND_ID, SOURCE_BRAND_TERM));

    Set<SnowstormRelationship> result =
        BrandPackSizeService.buildNewBrandedProductRelationships(
            sourceRels,
            newBrandMini(),
            ModelLevelType.REAL_MEDICINAL_PRODUCT,
            Set.of(EXISTING_BRANDED_TPP_ID),
            MODULE_ID);

    assertThat(isADestinationIds(result))
        .as("IS_A pointing at being-replaced branded ancestor must be stripped")
        .doesNotContain(EXISTING_BRANDED_TPP_ID);
    assertThat(isADestinationIds(result))
        .as("Other IS_A parents (root + type-specific) must be preserved")
        .containsExactlyInAnyOrder(MEDICINAL_PRODUCT.getValue(), NMPC_NUTRITIONAL_MP_ID);
  }

  /**
   * Non-top branded levels (e.g. REAL_CLINICAL_DRUG which has REAL_MEDICINAL_PRODUCT as a branded
   * ancestor) must NOT have the SNOMED MEDICINAL_PRODUCT root injected. Only the top branded level
   * (no branded ancestors) gets the root parent.
   */
  @Test
  void nonTopBrandedLevelDoesNotInjectMedicinalProductRoot() {
    Set<SnowstormRelationship> sourceRels = new HashSet<>();
    sourceRels.add(isA(SOURCE_TP_CONCEPT_ID, "Source ATM (real medicinal product)"));
    sourceRels.add(hasProductName(SOURCE_BRAND_ID, SOURCE_BRAND_TERM));

    Set<SnowstormRelationship> result =
        BrandPackSizeService.buildNewBrandedProductRelationships(
            sourceRels,
            newBrandMini(),
            ModelLevelType.REAL_CLINICAL_DRUG,
            Set.of(SOURCE_TP_CONCEPT_ID),
            MODULE_ID);

    assertThat(isADestinationIds(result))
        .as(
            "REAL_CLINICAL_DRUG has a branded ancestor (REAL_MEDICINAL_PRODUCT) so the helper "
                + "must not auto-add MEDICINAL_PRODUCT root - the addEdgesAndNodes orchestration "
                + "will reattach an IS_A to the newly minted REAL_MEDICINAL_PRODUCT instead.")
        .doesNotContain(MEDICINAL_PRODUCT.getValue());
    assertThat(isADestinationIds(result))
        .as("The IS_A pointing at the being-replaced branded ancestor must be stripped")
        .doesNotContain(SOURCE_TP_CONCEPT_ID);
  }

  /**
   * Every relationship coming back must be flagged as a stated relationship - the helper sets this
   * on every cloned rel because the source axiom rels can carry the inferred characteristic id.
   */
  @Test
  void marksAllRelationshipsAsStated() {
    Set<SnowstormRelationship> sourceRels = new HashSet<>();
    sourceRels.add(isA(MEDICINAL_PRODUCT.getValue(), MEDICINAL_PRODUCT.getLabel()));
    sourceRels.add(hasProductName(SOURCE_BRAND_ID, SOURCE_BRAND_TERM));

    Set<SnowstormRelationship> result =
        BrandPackSizeService.buildNewBrandedProductRelationships(
            sourceRels, newBrandMini(), ModelLevelType.REAL_MEDICINAL_PRODUCT, Set.of(), MODULE_ID);

    assertThat(result)
        .allSatisfy(
            r ->
                assertThat(r.getCharacteristicTypeId())
                    .isEqualTo(STATED_RELATIONSHUIP_CHARACTRISTIC_TYPE.getValue()));
  }

  /**
   * The new brand replacement must apply even if the source axiom contains multiple
   * HAS_PRODUCT_NAME relationships (defensive - shouldn't normally happen but the loop visits all
   * of them).
   */
  @Test
  void retargetsAllHasProductNameRelationshipsToNewBrand() {
    Set<SnowstormRelationship> sourceRels = new HashSet<>();
    sourceRels.add(isA(MEDICINAL_PRODUCT.getValue(), MEDICINAL_PRODUCT.getLabel()));
    sourceRels.add(hasProductName(SOURCE_BRAND_ID, SOURCE_BRAND_TERM));

    Set<SnowstormRelationship> result =
        BrandPackSizeService.buildNewBrandedProductRelationships(
            sourceRels, newBrandMini(), ModelLevelType.REAL_MEDICINAL_PRODUCT, Set.of(), MODULE_ID);

    assertThat(result)
        .filteredOn(r -> HAS_PRODUCT_NAME.getValue().equals(r.getTypeId()))
        .extracting(SnowstormRelationship::getDestinationId)
        .containsExactly(NEW_BRAND_CONCEPT_ID);
  }
}
