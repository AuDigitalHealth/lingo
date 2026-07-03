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

import static org.assertj.core.api.Assertions.assertThat;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.product.details.NutritionalProductDetails;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for nutritional product name composition in {@link
 * MedicationProductCalculationService}. Regression coverage for IEDC-7476: the dose form/container
 * was duplicated onto the VMP name, and the brand was prepended to the AMP instead of using the
 * branded product name.
 */
class MedicationProductCalculationServiceNutritionalNameTest {

  private static final String GENERIC_NAME =
      "Virtual SmofKabiven Peripheral 1206 mL emulsion for infusion bag";
  private static final String BRANDED_NAME =
      "SmofKabiven Peripheral 1206 mL emulsion for infusion bag";

  private static ModelLevel level(ModelLevelType type) {
    ModelLevel level = new ModelLevel();
    level.setModelLevelType(type);
    return level;
  }

  private static NutritionalProductDetails details() {
    NutritionalProductDetails details = new NutritionalProductDetails();
    details.setNewGenericProductName(GENERIC_NAME);
    details.setBrandedProductName(BRANDED_NAME);
    details.setProductName(
        new SnowstormConceptMini()
            .pt(new SnowstormTermLangPojo().lang("en").term("SmofKabiven (brand)")));
    return details;
  }

  @Test
  void vmpUsesNewGenericProductNameVerbatimWithoutAppendingFormOrContainer() {
    String name =
        MedicationProductCalculationService.generateNutritionalProductName(
            level(ModelLevelType.CLINICAL_DRUG), details());
    assertThat(name).isEqualTo(GENERIC_NAME);
    // Regression: the dose form/container must not be duplicated onto a name that already carries
    // it.
    assertThat(name).doesNotContain("bag emulsion for infusion bag");
  }

  @Test
  void ampUsesBrandedProductNameVerbatimWithoutPrependingTheBrand() {
    String name =
        MedicationProductCalculationService.generateNutritionalProductName(
            level(ModelLevelType.REAL_CLINICAL_DRUG), details());
    assertThat(name).isEqualTo(BRANDED_NAME);
    assertThat(name).doesNotContain("(brand)");
  }

  @Test
  void atmUsesTheBareBrandWithTheBrandTagStripped() {
    String name =
        MedicationProductCalculationService.generateNutritionalProductName(
            level(ModelLevelType.REAL_MEDICINAL_PRODUCT), details());
    assertThat(name).isEqualTo("SmofKabiven");
  }

  @Test
  void returnsNullInsteadOfThrowingWhenTheAmpNameIsMissing() {
    // Regression: getBrandedProductName().trim() must not NPE on the (unvalidated) preview path.
    NutritionalProductDetails details = details();
    details.setBrandedProductName(null);
    assertThat(
            MedicationProductCalculationService.generateNutritionalProductName(
                level(ModelLevelType.REAL_CLINICAL_DRUG), details))
        .isNull();
  }

  @Test
  void returnsNullInsteadOfThrowingWhenTheVmpNameIsMissing() {
    NutritionalProductDetails details = details();
    details.setNewGenericProductName("   ");
    assertThat(
            MedicationProductCalculationService.generateNutritionalProductName(
                level(ModelLevelType.CLINICAL_DRUG), details))
        .isNull();
  }

  @Test
  void stripBrandTagRemovesTrailingBrandTagOnly() {
    assertThat(MedicationProductCalculationService.stripBrandTag("Ensure Compact (brand)"))
        .isEqualTo("Ensure Compact");
    assertThat(MedicationProductCalculationService.stripBrandTag("Ensure Compact"))
        .isEqualTo("Ensure Compact");
    assertThat(MedicationProductCalculationService.stripBrandTag(null)).isNull();
  }
}
