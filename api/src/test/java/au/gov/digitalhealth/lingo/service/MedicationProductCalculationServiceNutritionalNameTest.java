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

import static au.gov.digitalhealth.lingo.util.SnomedConstants.UNIT_OF_PRESENTATION;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleAxiom;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.toSnowstormConceptMini;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormItemsPageReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormItemsPageRelationship;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import au.gov.digitalhealth.lingo.configuration.Configuration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.product.FsnAndPt;
import au.gov.digitalhealth.lingo.product.NewConceptDetails;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.NutritionalProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.ProductQuantity;
import au.gov.digitalhealth.lingo.service.namegenerator.NameGenerationClient;
import au.gov.digitalhealth.lingo.util.NmpcConstants;
import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.ExecutionException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.MockReset;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Tests for nutritional product handling in {@link MedicationProductCalculationService}.
 *
 * <p>The first block of tests below (static-method tests, no Spring context needed) is regression
 * coverage for IEDC-7476: the dose form/container was duplicated onto the VMP name, and the brand
 * was prepended to the AMP instead of using the branded product name.
 *
 * <p>The second block ({@link #newNutritionalVmpDefaultsToPrimitiveWhenNoStrengthDataSupplied()},
 * {@link #newNutritionalAmpDefaultsToPrimitiveWhenNoStrengthDataSupplied()}) is regression coverage
 * for a customer-reported defect: prior to deployment 1.3.49, nutritional VMP/AMP concepts with no
 * strength data defaulted to Primitive. A change that added "if the product has a productName it is
 * defined by default" (for branded products generally) inadvertently forced nutritional VMP/AMP to
 * Fully Defined, since nutritional products always carry a productName (the brand, mandatory for
 * naming) regardless of how simply they are modelled — causing over-eager classification pull-in on
 * authoring tasks. VTM/ATM were unaffected because they are built by {@code findOrCreateMp}, which
 * never had the productName check.
 */
@SpringBootTest(
    classes = Configuration.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Isolated
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

  // ---------------------------------------------------------------------------
  // VMP/AMP primitive-by-default regression tests (IEDC customer report)
  // ---------------------------------------------------------------------------

  /**
   * NMPC branch path. {@link
   * au.gov.digitalhealth.lingo.configuration.model.Models#getModelConfiguration(String)} converts
   * {@code |} to {@code _} for key lookup, so {@code "MAIN/SNOMEDCT-IE"} maps to the {@code
   * MAIN_SNOMEDCT-IE} config key. Using the underscore form directly avoids URL-filter encoding.
   */
  private static final String NMPC_BRANCH = "MAIN_SNOMEDCT-IE";

  /** Real NMPC SCTID (passes Verhoeff validation) used as a stand-in for the generic form. */
  private static final String GENERIC_FORM_ID = NmpcConstants.VIRTUAL_MEDICINAL_PRODUCT.getValue();

  /** Real NMPC SCTID used as a stand-in for the brand (product name) concept. */
  private static final String PRODUCT_NAME_ID = NmpcConstants.PACKAGE_NMPC.getValue();

  /**
   * Real NMPC SCTID used as a stand-in for the pre-existing VTM {@code existingMedicinalProduct}
   * that nutritional products are mandatorily linked to (the VTM level is looked up, not authored,
   * for nutritional products).
   */
  private static final String EXISTING_MP_ID = NmpcConstants.CONTAINS_DEVICE_NMPC.getValue();

  /**
   * NMPC authoring module. {@code existingMedicinalProduct} must carry it, or {@link
   * au.gov.digitalhealth.lingo.product.OriginalNode#of} cannot determine externality when the VTM
   * is looked up as a pre-existing concept.
   */
  private static final String NMPC_MODULE_ID = "1601000220105";

  @MockBean(reset = MockReset.NONE)
  SnowstormClient snowstormClient;

  @MockBean(reset = MockReset.NONE)
  NameGenerationClient nameGenerationClient;

  @Autowired MedicationProductCalculationService productCalculationService;

  @BeforeEach
  void stubMocks() {
    // ECL lookups return nothing → every node becomes a new concept.
    when(snowstormClient.getConceptsFromEcl(anyString(), anyString(), anyInt(), anyBoolean()))
        .thenReturn(List.of());
    when(snowstormClient.getConceptsFromEcl(
            anyString(), anyString(), anyInt(), anyInt(), anyBoolean()))
        .thenReturn(List.of());
    when(snowstormClient.getConceptsFromEcl(
            anyString(), anyString(), anyInt(), anyInt(), anyBoolean(), any()))
        .thenReturn(List.of());

    // Concept-existence check (used by optionallyAddNmpcType): return empty → nmpcType skipped.
    when(snowstormClient.conceptIdsThatExist(anyString(), any())).thenReturn(List.<String>of());

    // Task / project change-tracking: no concepts changed.
    when(snowstormClient.getConceptIdsChangedOnTask(anyString()))
        .thenReturn(Mono.just(List.<String>of()));
    when(snowstormClient.getConceptIdsChangedOnProject(anyString()))
        .thenReturn(Mono.just(List.<String>of()));

    // The nutritional VTM is looked up as an existing concept (not authored) -
    // populateNodeProperties
    // then pulls historical associations, axioms, relationships and refset members for it.
    when(snowstormClient.getHistoricalAssociations(anyString(), anyString()))
        .thenReturn(Mono.just(List.of()));
    when(snowstormClient.getBrowserConcepts(anyString(), any())).thenReturn(Flux.empty());
    when(snowstormClient.getRelationships(anyString(), anyString()))
        .thenReturn(Mono.just(new SnowstormItemsPageRelationship().items(List.of())));
    when(snowstormClient.getRefsetMembers(anyString(), any(), any(), anyInt(), anyInt()))
        .thenReturn(Mono.just(new SnowstormItemsPageReferenceSetMember().items(List.of())));

    // Name generator: return a plausible stub FSN and PT.
    when(nameGenerationClient.generateNames(any()))
        .thenReturn(
            FsnAndPt.builder().FSN("Mock fully specified name").PT("Mock preferred term").build());
  }

  @Test
  void newNutritionalVmpDefaultsToPrimitiveWhenNoStrengthDataSupplied()
      throws ExecutionException, InterruptedException {
    ProductSummary summary =
        productCalculationService.calculateProductFromAtomicData(NMPC_BRANCH, nutritionalPackage());

    SnowstormAxiom vmpAxiom = getSingleAxiom(newNodeAt(summary, ModelLevelType.CLINICAL_DRUG));

    assertThat(vmpAxiom.getDefinitionStatus())
        .as(
            "a new nutritional VMP with no ingredient strength data must default to Primitive, not"
                + " Fully Defined, purely because a productName (brand) is present")
        .isEqualTo("PRIMITIVE");
  }

  @Test
  void newNutritionalAmpDefaultsToPrimitiveWhenNoStrengthDataSupplied()
      throws ExecutionException, InterruptedException {
    ProductSummary summary =
        productCalculationService.calculateProductFromAtomicData(NMPC_BRANCH, nutritionalPackage());

    SnowstormAxiom ampAxiom = getSingleAxiom(newNodeAt(summary, ModelLevelType.REAL_CLINICAL_DRUG));

    assertThat(ampAxiom.getDefinitionStatus())
        .as(
            "a new nutritional AMP with no ingredient strength data must default to Primitive, not"
                + " Fully Defined, purely because a productName (brand) is present")
        .isEqualTo("PRIMITIVE");
  }

  private NewConceptDetails newNodeAt(ProductSummary summary, ModelLevelType modelLevelType) {
    return summary.getNodes().stream()
        .filter(Node::isNewConcept)
        .filter(n -> n.getModelLevel().equals(modelLevelType))
        .findFirst()
        .orElseThrow(
            () ->
                new AssertionError(
                    "No new-concept node found at "
                        + modelLevelType
                        + " level; nodes were: "
                        + summary.getNodes()))
        .getNewConceptDetails();
  }

  /**
   * Builds a minimal, valid NMPC nutritional {@link PackageDetails}: no active ingredients (as
   * required for nutritional products), a new generic/branded name pair for the VMP/AMP, and the
   * mandatory pre-existing VTM link.
   */
  private static PackageDetails<MedicationProductDetails> nutritionalPackage() {
    NutritionalProductDetails productDetails = new NutritionalProductDetails();
    productDetails.setGenericForm(
        toSnowstormConceptMini(GENERIC_FORM_ID, "Virtual medicinal product (product)"));
    // productName (brand) is required by NmpcMedicationDetailsValidator, and is the very field that
    // used to force this product to Fully Defined regardless of its (lack of) modelling detail.
    productDetails.setProductName(toSnowstormConceptMini(PRODUCT_NAME_ID, "SmofKabiven (brand)"));
    productDetails.setExistingMedicinalProduct(
        toSnowstormConceptMini(EXISTING_MP_ID, "SmofKabiven nutritional product (product)")
            .moduleId(NMPC_MODULE_ID));
    productDetails.setNewGenericProductName(GENERIC_NAME);
    productDetails.setBrandedProductName(BRANDED_NAME);

    ProductQuantity<MedicationProductDetails> productQuantity = new ProductQuantity<>();
    productQuantity.setProductDetails(productDetails);
    // Unit of presentation with quantity 1 satisfies NMPC package quantity validation.
    productQuantity.setValue(BigDecimal.ONE);
    productQuantity.setUnit(
        toSnowstormConceptMini(
            UNIT_OF_PRESENTATION.getValue(), "Unit of presentation (unit of presentation)"));

    PackageDetails<MedicationProductDetails> packageDetails = new PackageDetails<>();
    packageDetails.getContainedProducts().add(productQuantity);
    return packageDetails;
  }
}
