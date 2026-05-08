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

class BrandPackSizeServiceTest {

  private static final String MODULE_ID = "900062011000036108";

  private static final String SOURCE_TP_CONCEPT_ID = "934531000220104";
  private static final String NEW_BRAND_CONCEPT_ID = "919341000220105";
  private static final String NEW_BRAND_TERM = "Dougal Brandy (brand) (product name)";

  private static final String EXISTING_BRANDED_TPP_ID = "955511000220105";

  private static final String NMPC_NUTRITIONAL_MP_ID = "681011000220107";
  private static final String NMPC_NUTRITIONAL_MP_TERM = "NMPC Oral Nutritional product (product)";

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
        .as("MEDICINAL_PRODUCT root must only be auto-added at the top branded level")
        .doesNotContain(MEDICINAL_PRODUCT.getValue());
    assertThat(isADestinationIds(result)).doesNotContain(SOURCE_TP_CONCEPT_ID);
  }

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
