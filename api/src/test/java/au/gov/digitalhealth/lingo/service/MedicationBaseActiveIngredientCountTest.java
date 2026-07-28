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

import static au.gov.digitalhealth.lingo.util.SnomedConstants.COUNT_OF_BASE_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.UNIT_OF_PRESENTATION;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleAxiom;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.toSnowstormConceptMini;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.gov.digitalhealth.lingo.configuration.Configuration;
import au.gov.digitalhealth.lingo.product.FsnAndPt;
import au.gov.digitalhealth.lingo.product.NameGeneratorSpec;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.Ingredient;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.ProductQuantity;
import au.gov.digitalhealth.lingo.product.details.Quantity;
import au.gov.digitalhealth.lingo.service.namegenerator.NameGenerationClient;
import au.gov.digitalhealth.lingo.util.NmpcConstants;
import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;
import org.mockito.stubbing.Answer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockReset;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import reactor.core.publisher.Mono;

/**
 * Verifies how {@link MedicationProductCalculationService} builds the ECL that counts the base
 * active ingredient substances - the {@code Count of base of active ingredient} relationship stated
 * on the NMPC MP-only (VTM) / RMP levels.
 *
 * <p>Regression guard for CUST1730375 / NMPC-001949: authoring a product whose active ingredient is
 * a modification of two different base substances (e.g. {@code 770718007 | Sodium zirconium
 * cyclosilicate|}, a modification of both sodium silicate and zirconium silicate) caused {@code
 * $calculate} to fail with a 500 "Too many concepts". The old ECL walked {@code is modification of}
 * unconditionally and capped the result at the ingredient count, so a single ingredient that
 * resolved to two bases exceeded the limit. Per the SNOMED editorial guide ("Chemical element
 * compound with multiple modification"), such a compound is its own base, so the count must be 1.
 *
 * <p>The fix gates each modification hop with {@code : [1..1] 738774007 = *} (only descend through
 * substances that are a modification of exactly one thing) and treats a substance with two or more
 * modification attributes ({@code [2..*]}) as a base in its own right. Because descent only follows
 * single-modification links, each ingredient contributes exactly one base, so the result can never
 * exceed the ingredient count that bounds the query. This test asserts the generated ECL carries
 * both constructs and stays within that bound.
 *
 * <p>Snowstorm and the name-generation client are mocked so the test drives the service end to end
 * without a real terminology server; the ECL semantics themselves are verified against a live
 * server. {@link Isolated} prevents concurrent execution with other {@link SpringBootTest} classes
 * that share the same mock beans.
 */
@SpringBootTest(
    classes = Configuration.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Isolated
class MedicationBaseActiveIngredientCountTest {

  /** NMPC branch config key (see {@code MedicationVmpParentTest} for the encoding note). */
  private static final String NMPC_BRANCH = "MAIN_SNOMEDCT-IE";

  /**
   * Real NMPC SCTIDs (pass Verhoeff) used as stand-ins; Snowstorm is mocked so no lookup occurs.
   */
  private static final String GENERIC_FORM_ID = NmpcConstants.VIRTUAL_MEDICINAL_PRODUCT.getValue();

  private static final String PRODUCT_NAME_ID = NmpcConstants.PACKAGE_NMPC.getValue();

  /** Sodium zirconium cyclosilicate - a real substance that is a modification of two bases. */
  private static final String ACTIVE_INGREDIENT_ID = "770718007";

  /**
   * Concept id the mocked base-ingredient ECL resolves to (the compound is its own single base).
   */
  private static final String BASE_SUBSTANCE_ID = "770718007";

  @MockitoBean(reset = MockReset.NONE)
  SnowstormClient snowstormClient;

  @MockitoBean(reset = MockReset.NONE)
  NameGenerationClient nameGenerationClient;

  @Autowired MedicationProductCalculationService productCalculationService;

  private final AtomicReference<String> capturedBaseEcl = new AtomicReference<>();
  private final AtomicInteger capturedLimit = new AtomicInteger(-1);

  @BeforeEach
  void stubMocks() {
    capturedBaseEcl.set(null);
    capturedLimit.set(-1);

    when(snowstormClient.getConceptsFromEcl(anyString(), anyString(), anyInt(), anyBoolean()))
        .thenReturn(List.of());
    when(snowstormClient.getConceptsFromEcl(
            anyString(), anyString(), anyInt(), anyInt(), anyBoolean()))
        .thenReturn(List.of());
    when(snowstormClient.getConceptsFromEcl(
            anyString(), anyString(), anyInt(), anyInt(), anyBoolean(), any()))
        .thenReturn(List.of());

    // Capture the base-ingredient ECL (the only getConceptIdsFromEcl call that walks 738774007) and
    // return a single base id, mimicking a compound that resolves to exactly one base.
    when(snowstormClient.getConceptIdsFromEcl(
            anyString(), anyString(), anyInt(), anyInt(), anyBoolean(), any()))
        .thenAnswer(
            (Answer<List<String>>)
                invocation -> {
                  String ecl = invocation.getArgument(1);
                  if (ecl.contains("738774007")) {
                    capturedBaseEcl.set(ecl);
                    capturedLimit.set(invocation.getArgument(3));
                    return List.of(BASE_SUBSTANCE_ID);
                  }
                  return List.of();
                });

    when(snowstormClient.conceptIdsThatExist(anyString(), any())).thenReturn(List.<String>of());
    when(snowstormClient.getConceptIdsChangedOnTask(anyString()))
        .thenReturn(Mono.just(List.<String>of()));
    when(snowstormClient.getConceptIdsChangedOnProject(anyString()))
        .thenReturn(Mono.just(List.<String>of()));

    when(nameGenerationClient.generateNames(any(NameGeneratorSpec.class)))
        .thenAnswer(
            (Answer<FsnAndPt>)
                invocation -> {
                  NameGeneratorSpec spec = invocation.getArgument(0, NameGeneratorSpec.class);
                  return FsnAndPt.builder()
                      .FSN("Mock fully specified name (" + spec.getTag() + ")")
                      .PT("Mock preferred term")
                      .build();
                });
  }

  @Test
  void baseActiveIngredientEclGatesModificationWalkAndTreatsMultiModificationAsItsOwnBase()
      throws ExecutionException, InterruptedException {
    productCalculationService.calculateProductFromAtomicData(NMPC_BRANCH, nmpcPackage());

    assertThat(capturedBaseEcl.get())
        .as("the base-ingredient ECL must have been executed for a product with an ingredient")
        .isNotNull();

    assertThat(capturedBaseEcl.get())
        .as(
            "each modification hop must be gated by [1..1] so the walk only descends through"
                + " substances that are a modification of exactly one thing")
        .contains("[1..1] 738774007 = *");

    assertThat(capturedBaseEcl.get())
        .as(
            "a substance with two or more modification attributes ([2..*]) must be counted as a"
                + " base in its own right (SNOMED multi-modification compound exception)")
        .contains("[2..*] 738774007 = *");

    assertThat(capturedLimit.get())
        .as(
            "the query is bounded by the ingredient count; because descent only follows"
                + " single-modification links each ingredient yields at most one base, so the total"
                + " can never exceed this bound")
        .isEqualTo(1);
  }

  @Test
  void baseCountRelationshipReflectsResolvedBaseSubstances()
      throws ExecutionException, InterruptedException {
    ProductSummary summary =
        productCalculationService.calculateProductFromAtomicData(NMPC_BRANCH, nmpcPackage());

    assertThat(baseCountValues(summary))
        .as(
            "a single ingredient resolving to one base must emit the %s relationship with value 1",
            COUNT_OF_BASE_ACTIVE_INGREDIENT.getValue())
        .isNotEmpty()
        .containsOnly("1");
  }

  /** Collects every concrete {@code Count of base of active ingredient} value across new nodes. */
  private static List<String> baseCountValues(ProductSummary summary) {
    return summary.getNodes().stream()
        .filter(Node::isNewConcept)
        .flatMap(n -> getSingleAxiom(n.getNewConceptDetails()).getRelationships().stream())
        .filter(r -> COUNT_OF_BASE_ACTIVE_INGREDIENT.getValue().equals(r.getTypeId()))
        .filter(r -> r.getConcreteValue() != null)
        .map(r -> r.getConcreteValue().getValue())
        .toList();
  }

  /**
   * Minimal NMPC package with a single contained product carrying one active ingredient at a
   * presentation strength, mirroring the shape of the Lokelma payload from the ticket. A
   * non-nutritional, non-vaccine NMPC product must carry a strength, which in turn requires the
   * refined/precise/BoSS substances to be populated.
   */
  private static PackageDetails<MedicationProductDetails> nmpcPackage() {
    SnowstormConceptMini sachet =
        toSnowstormConceptMini("733013000", "Sachet (unit of presentation)");

    MedicationProductDetails productDetails = new MedicationProductDetails();
    productDetails.setGenericForm(
        toSnowstormConceptMini(GENERIC_FORM_ID, "Virtual medicinal product (product)"));
    productDetails.setProductName(
        toSnowstormConceptMini(PRODUCT_NAME_ID, "Ongentys (product name)"));
    productDetails.setUnitOfPresentation(sachet);

    SnowstormConceptMini substance =
        toSnowstormConceptMini(ACTIVE_INGREDIENT_ID, "Sodium zirconium cyclosilicate (substance)");
    Ingredient ingredient = new Ingredient();
    ingredient.setActiveIngredient(substance);
    ingredient.setRefinedActiveIngredient(substance);
    ingredient.setPreciseIngredient(substance);
    ingredient.setBasisOfStrengthSubstance(substance);
    ingredient.setPresentationStrengthNumerator(
        new Quantity(
            BigDecimal.valueOf(5), toSnowstormConceptMini("258682000", "gram (qualifier value)")));
    ingredient.setPresentationStrengthDenominator(new Quantity(BigDecimal.ONE, sachet));
    productDetails.getActiveIngredients().add(ingredient);

    ProductQuantity<MedicationProductDetails> productQuantity = new ProductQuantity<>();
    productQuantity.setProductDetails(productDetails);
    productQuantity.setValue(BigDecimal.ONE);
    productQuantity.setUnit(
        toSnowstormConceptMini(
            UNIT_OF_PRESENTATION.getValue(), "Unit of presentation (unit of presentation)"));

    PackageDetails<MedicationProductDetails> packageDetails = new PackageDetails<>();
    packageDetails.getContainedProducts().add(productQuantity);
    return packageDetails;
  }
}
