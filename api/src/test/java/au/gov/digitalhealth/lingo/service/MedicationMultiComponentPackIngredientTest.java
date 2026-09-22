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

import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.HAS_PRECISE_ACTIVE_INGREDIENT;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.IS_A;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getRelationshipsFromAxioms;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelType;
import au.gov.digitalhealth.lingo.exception.AtomicDataExtractionProblem;
import au.gov.digitalhealth.lingo.service.fhir.FhirClient;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

/**
 * Regression guard for the Pabrinex multi-component pack failure: "Expected 1 active ingredient for
 * precise ingredient 126227009 but found for product 1008011000220108".
 *
 * <p>{@code 1008011000220108} is a real packaged clinical drug containing two different real
 * clinical drugs (ampoule 1 and ampoule 2), each with its own MP-only (VTM) and clinical drug (VMP)
 * concept:
 *
 * <ul>
 *   <li>ampoule 1 -&gt; VTM 988791000220107 (ascorbic acid, nicotinamide, glucose)
 *   <li>ampoule 2 -&gt; VTM 988801000220108 (thiamine, riboflavin, pyridoxine)
 * </ul>
 *
 * <p>The contained products state only precise active ingredients, so {@code MedicationService}
 * recovers the active ingredient from the VTM. It used to pick the VTM with {@code findFirst()}
 * over the whole pack's type map - a {@code HashMap}, so effectively an arbitrary choice, and never
 * scoped to the product being processed. Whichever VTM won, the three precise ingredients belonging
 * to the other ampoule could not resolve and extraction failed. Verified against
 * MAIN/SNOMEDCT-IE/IEDC/IEDC-8768: intersecting Snomio's candidate set for 126227009 (pyridoxine
 * hydrochloride) with VTM 988791000220107 yields 0, and with VTM 988801000220108 yields exactly 1
 * (430469009 pyridoxine).
 */
class MedicationMultiComponentPackIngredientTest {

  private static final String VTM_REFSET = "660351000220100";
  private static final String VMP_REFSET = "660371000220109";

  private static final String AMPOULE_1 = "1008001000220105";
  private static final String AMPOULE_2 = "1007991000220101";
  private static final String VMP_A = "988811000220106";
  private static final String VMP_B = "988821000220104";
  private static final String VTM_A = "988791000220107";
  private static final String VTM_B = "988801000220108";
  private static final String PACK = "1008011000220108";

  private static final String PYRIDOXINE = "430469009";
  private static final String THIAMINE = "259659006";
  private static final String RIBOFLAVIN = "13235001";
  private static final String NICOTINAMIDE = "173196005";
  private static final String GLUCOSE = "67079006";
  private static final String ASCORBIC_ACID = "43706004";

  private static final String PYRIDOXINE_HCL = "126227009";
  private static final String THIAMINE_HCL = "126228004";
  private static final String RIBOFLAVIN_PHOSPHATE = "442346000";

  private static final String BRANCH = "MAIN/SNOMEDCT-IE/IEDC/IEDC-8768";

  /** A VTM stating {@code Has active ingredient} for each of {@code ingredientIds}. */
  private static SnowstormConcept vtmWithIngredients(String conceptId, String... ingredientIds) {
    Set<SnowstormRelationship> relationships =
        java.util.Arrays.stream(ingredientIds)
            .map(
                ingredientId ->
                    new SnowstormRelationship()
                        .active(true)
                        .characteristicType("STATED_RELATIONSHIP")
                        .groupId(0)
                        .type(mini(HAS_ACTIVE_INGREDIENT.getValue()))
                        .typeId(HAS_ACTIVE_INGREDIENT.getValue())
                        .target(mini(ingredientId))
                        .destinationId(ingredientId))
            .collect(Collectors.toSet());

    return new SnowstormConcept()
        .conceptId(conceptId)
        .classAxioms(Set.of(new SnowstormAxiom().active(true).relationships(relationships)));
  }

  private static SnowstormConceptMini mini(String conceptId) {
    return new SnowstormConceptMini().conceptId(conceptId);
  }

  private static SnowstormRelationship statedRelationship(
      String typeId, String targetId, int group) {
    return new SnowstormRelationship()
        .active(true)
        .characteristicType("STATED_RELATIONSHIP")
        .groupId(group)
        .type(mini(typeId))
        .typeId(typeId)
        .target(mini(targetId))
        .destinationId(targetId);
  }

  /** A concept stating IS-A to each parent and {@code Has active ingredient} to each ingredient. */
  private static SnowstormConcept conceptWith(
      String conceptId, Set<String> parentIds, Set<String> ingredientIds) {
    Set<SnowstormRelationship> relationships = new java.util.HashSet<>();
    parentIds.forEach(p -> relationships.add(statedRelationship(IS_A.getValue(), p, 0)));
    ingredientIds.forEach(
        i -> relationships.add(statedRelationship(HAS_ACTIVE_INGREDIENT.getValue(), i, 0)));
    return new SnowstormConcept()
        .conceptId(conceptId)
        // the nutritional-supplement check reads getRelationships() directly, so it must be
        // non-null
        .relationships(Set.of())
        .classAxioms(Set.of(new SnowstormAxiom().active(true).relationships(relationships)));
  }

  /** A concept whose single class axiom states an IS-A to each of {@code parentIds}. */
  private static SnowstormConcept concept(String conceptId, String... parentIds) {
    Set<SnowstormRelationship> relationships =
        java.util.Arrays.stream(parentIds)
            .map(
                parentId ->
                    new SnowstormRelationship()
                        .active(true)
                        .characteristicType("STATED_RELATIONSHIP")
                        .groupId(0)
                        .type(mini(IS_A.getValue()))
                        .typeId(IS_A.getValue())
                        .target(mini(parentId))
                        .destinationId(parentId))
            .collect(java.util.stream.Collectors.toSet());

    return new SnowstormConcept()
        .conceptId(conceptId)
        .classAxioms(Set.of(new SnowstormAxiom().active(true).relationships(relationships)));
  }

  /**
   * The pack as modelled: two ampoules, each under its own VMP, each VMP under its own VTM. Uses a
   * LinkedHashMap so VTM_A is deliberately encountered first - reproducing the case where the old
   * findFirst() picked the wrong VTM for ampoule 2.
   */
  private static Map<String, SnowstormConcept> browserMap() {
    Map<String, SnowstormConcept> browserMap = new LinkedHashMap<>();
    browserMap.put(VTM_A, concept(VTM_A));
    browserMap.put(VMP_A, concept(VMP_A, VTM_A));
    browserMap.put(AMPOULE_1, concept(AMPOULE_1, VMP_A));
    browserMap.put(VTM_B, concept(VTM_B));
    browserMap.put(VMP_B, concept(VMP_B, VTM_B));
    browserMap.put(AMPOULE_2, concept(AMPOULE_2, VMP_B));
    return browserMap;
  }

  private static Map<String, String> typeMap() {
    Map<String, String> typeMap = new HashMap<>();
    typeMap.put(VTM_A, VTM_REFSET);
    typeMap.put(VTM_B, VTM_REFSET);
    typeMap.put(VMP_A, VMP_REFSET);
    typeMap.put(VMP_B, VMP_REFSET);
    return typeMap;
  }

  @Test
  void resolvesTheVtmBelongingToTheProductBeingProcessedNotAnArbitraryOne() {
    Map<String, SnowstormConcept> browserMap = browserMap();
    Map<String, String> typeMap = typeMap();

    assertThat(
            MedicationService.findModelLevelConceptForProduct(
                browserMap.get(AMPOULE_2), browserMap, typeMap, VTM_REFSET))
        .as(
            "ampoule 2 must resolve to its own VTM (%s, thiamine/riboflavin/pyridoxine), not %s",
            VTM_B, VTM_A)
        .contains(VTM_B);

    assertThat(
            MedicationService.findModelLevelConceptForProduct(
                browserMap.get(AMPOULE_1), browserMap, typeMap, VTM_REFSET))
        .as("ampoule 1 must resolve to its own VTM (%s)", VTM_A)
        .contains(VTM_A);
  }

  @Test
  void resolvesTheClinicalDrugLevelPerProductToo() {
    Map<String, SnowstormConcept> browserMap = browserMap();
    Map<String, String> typeMap = typeMap();

    assertThat(
            MedicationService.findModelLevelConceptForProduct(
                browserMap.get(AMPOULE_2), browserMap, typeMap, VMP_REFSET))
        .as("ampoule 2 must resolve to its own VMP")
        .contains(VMP_B);

    assertThat(
            MedicationService.findModelLevelConceptForProduct(
                browserMap.get(AMPOULE_1), browserMap, typeMap, VMP_REFSET))
        .as("ampoule 1 must resolve to its own VMP")
        .contains(VMP_A);
  }

  @Test
  void stopsAtTheFirstMatchingLevelRatherThanWalkingPastIt() {
    // Walking for the VMP level from ampoule 2 must not continue up to the VTM and report
    // ambiguity - it stops as soon as it reaches a concept at the requested level.
    Map<String, SnowstormConcept> browserMap = browserMap();
    Map<String, String> typeMap = typeMap();

    assertThat(
            MedicationService.findModelLevelConceptForProduct(
                browserMap.get(AMPOULE_2), browserMap, typeMap, VMP_REFSET))
        .isPresent();
  }

  @Test
  void returnsEmptyWhenTheProductHasNoConceptAtThatLevelSoTheCallerCanFallBack() {
    Map<String, SnowstormConcept> browserMap = browserMap();
    Map<String, String> typeMap = typeMap();

    // A product that isn't linked into the pack hierarchy at all.
    SnowstormConcept orphan = concept("999999999999999");

    assertThat(
            MedicationService.findModelLevelConceptForProduct(
                orphan, browserMap, typeMap, VTM_REFSET))
        .as("an unresolvable product yields empty so the caller keeps its previous behaviour")
        .isEqualTo(Optional.empty());
  }

  /**
   * The guard that actually fails without the fix. The old implementation picked one concept at the
   * requested level for the whole pack, so it returned the <em>same</em> ingredient map for both
   * ampoules - whichever VTM won, one of these two assertions had to fail, regardless of hash
   * ordering.
   */
  @Test
  void eachAmpouleGetsTheActiveIngredientsOfItsOwnVtm() {
    Map<String, SnowstormConcept> browserMap = browserMap();
    // give each VTM its real active ingredients
    browserMap.put(VTM_A, vtmWithIngredients(VTM_A, NICOTINAMIDE, GLUCOSE, ASCORBIC_ACID));
    browserMap.put(VTM_B, vtmWithIngredients(VTM_B, PYRIDOXINE, THIAMINE, RIBOFLAVIN));

    ModelLevel vtmLevel = Mockito.mock(ModelLevel.class);
    Mockito.when(vtmLevel.getReferenceSetIdentifier()).thenReturn(VTM_REFSET);
    ModelConfiguration modelConfiguration = Mockito.mock(ModelConfiguration.class);
    Mockito.when(modelConfiguration.getLevelOfType(ModelLevelType.MEDICINAL_PRODUCT_ONLY))
        .thenReturn(vtmLevel);

    Map<String, SnowstormConceptMini> forAmpoule2 =
        MedicationService.getClinicalDrugRelationships(
            PACK,
            browserMap.get(AMPOULE_2),
            browserMap,
            typeMap(),
            modelConfiguration,
            ModelLevelType.MEDICINAL_PRODUCT_ONLY);

    assertThat(forAmpoule2.keySet())
        .as(
            "ampoule 2 must see its own VTM's ingredients - pyridoxine is what 126227009 resolves to")
        .containsExactlyInAnyOrder(PYRIDOXINE, THIAMINE, RIBOFLAVIN);

    Map<String, SnowstormConceptMini> forAmpoule1 =
        MedicationService.getClinicalDrugRelationships(
            PACK,
            browserMap.get(AMPOULE_1),
            browserMap,
            typeMap(),
            modelConfiguration,
            ModelLevelType.MEDICINAL_PRODUCT_ONLY);

    assertThat(forAmpoule1.keySet())
        .as("ampoule 1 must see its own VTM's ingredients, not ampoule 2's")
        .containsExactlyInAnyOrder(NICOTINAMIDE, GLUCOSE, ASCORBIC_ACID);
  }

  /**
   * End-to-end guard over the path that actually threw: {@code getActivePreciseIngredientMap} ->
   * {@code findRelatedIngredient}. Ampoule 2 states only precise active ingredients, so each one
   * has to be resolved back to an active ingredient on its own VTM. Before the fix this raised
   * "Expected 1 active ingredient for precise ingredient 126227009 ... for product
   * 1008011000220108" because the ingredient map came from ampoule 1's VTM.
   */
  @Test
  void resolvesPreciseIngredientsToTheActiveIngredientsOfTheProductsOwnVtm() {
    // ampoule 2: two ingredient groups, each with a precise active ingredient and no active
    // ingredient - exactly how the NMPC content is modelled.
    SnowstormConcept ampoule2 =
        new SnowstormConcept()
            .conceptId(AMPOULE_2)
            .relationships(Set.of())
            .classAxioms(
                Set.of(
                    new SnowstormAxiom()
                        .active(true)
                        .relationships(
                            Set.of(
                                statedRelationship(IS_A.getValue(), VMP_B, 0),
                                statedRelationship(
                                    HAS_PRECISE_ACTIVE_INGREDIENT.getValue(), PYRIDOXINE_HCL, 1),
                                statedRelationship(
                                    HAS_PRECISE_ACTIVE_INGREDIENT.getValue(), THIAMINE_HCL, 2)))));

    Map<String, SnowstormConcept> browserMap = new LinkedHashMap<>();
    // VTM_A deliberately first, so an arbitrary "first at this level" pick lands on the wrong one
    browserMap.put(
        VTM_A, conceptWith(VTM_A, Set.of(), Set.of(NICOTINAMIDE, GLUCOSE, ASCORBIC_ACID)));
    browserMap.put(
        VMP_A, conceptWith(VMP_A, Set.of(VTM_A), Set.of(NICOTINAMIDE, GLUCOSE, ASCORBIC_ACID)));
    browserMap.put(VTM_B, conceptWith(VTM_B, Set.of(), Set.of(PYRIDOXINE, THIAMINE, RIBOFLAVIN)));
    // the VMP states the refined (hydrochloride) forms
    browserMap.put(
        VMP_B,
        conceptWith(
            VMP_B, Set.of(VTM_B), Set.of(PYRIDOXINE_HCL, THIAMINE_HCL, RIBOFLAVIN_PHOSPHATE)));
    browserMap.put(AMPOULE_2, ampoule2);

    ModelLevel vtmLevel = Mockito.mock(ModelLevel.class);
    Mockito.when(vtmLevel.getReferenceSetIdentifier()).thenReturn(VTM_REFSET);
    ModelLevel vmpLevel = Mockito.mock(ModelLevel.class);
    Mockito.when(vmpLevel.getReferenceSetIdentifier()).thenReturn(VMP_REFSET);

    ModelConfiguration modelConfiguration = Mockito.mock(ModelConfiguration.class);
    Mockito.when(modelConfiguration.getModelType()).thenReturn(ModelType.NMPC);
    Mockito.when(modelConfiguration.getLevelOfType(ModelLevelType.MEDICINAL_PRODUCT_ONLY))
        .thenReturn(vtmLevel);
    Mockito.when(modelConfiguration.getLevelOfType(ModelLevelType.CLINICAL_DRUG))
        .thenReturn(vmpLevel);
    Mockito.when(modelConfiguration.isExecuteEclAsStated()).thenReturn(true);

    Models models = Mockito.mock(Models.class);
    Mockito.when(models.getModelConfiguration(BRANCH)).thenReturn(modelConfiguration);

    // the base-substance ECL: pyridoxine hydrochloride resolves to pyridoxine, thiamine
    // hydrochloride to thiamine
    SnowstormClient snowstormClient = Mockito.mock(SnowstormClient.class);
    Mockito.when(
            snowstormClient.getConceptsIdsFromEcl(
                Mockito.eq(BRANCH),
                Mockito.anyString(),
                Mockito.eq(Long.parseLong(PYRIDOXINE_HCL)),
                Mockito.anyInt(),
                Mockito.anyInt(),
                Mockito.anyBoolean()))
        .thenReturn(List.of(PYRIDOXINE_HCL, PYRIDOXINE, "105590001"));
    Mockito.when(
            snowstormClient.getConceptsIdsFromEcl(
                Mockito.eq(BRANCH),
                Mockito.anyString(),
                Mockito.eq(Long.parseLong(THIAMINE_HCL)),
                Mockito.anyInt(),
                Mockito.anyInt(),
                Mockito.anyBoolean()))
        .thenReturn(List.of(THIAMINE_HCL, THIAMINE, "105590001"));

    MedicationService service =
        new MedicationService(snowstormClient, models, Mockito.mock(FhirClient.class));

    Map<Integer, MedicationService.ActivePreciseIngredient> result =
        service.getActivePreciseIngredientMap(
            BRANCH,
            PACK,
            ampoule2,
            browserMap,
            typeMap(),
            modelConfiguration,
            getRelationshipsFromAxioms(ampoule2));

    assertThat(result.get(1).getActiveIngredient().getConceptId())
        .as("pyridoxine hydrochloride must resolve to pyridoxine, from ampoule 2's own VTM")
        .isEqualTo(PYRIDOXINE);
    assertThat(result.get(2).getActiveIngredient().getConceptId())
        .as("thiamine hydrochloride must resolve to thiamine, from ampoule 2's own VTM")
        .isEqualTo(THIAMINE);

    assertThat(result.get(1).getRefinedActiveIngredient().getConceptId())
        .as("the refined active ingredient comes from the VMP and is the hydrochloride form")
        .isEqualTo(PYRIDOXINE_HCL);
  }

  /**
   * The "not found" case used to render as "... but found for product ..." - a blank where the
   * count belonged, which read as though something had been found and cost real time when
   * diagnosing this. It must now say how many were found.
   */
  @Test
  void reportsTheCandidateCountWhenAPreciseIngredientCannotBeResolved() {
    SnowstormConcept ampoule2 =
        new SnowstormConcept()
            .conceptId(AMPOULE_2)
            .relationships(Set.of())
            .classAxioms(
                Set.of(
                    new SnowstormAxiom()
                        .active(true)
                        .relationships(
                            Set.of(
                                statedRelationship(IS_A.getValue(), VMP_B, 0),
                                statedRelationship(
                                    HAS_PRECISE_ACTIVE_INGREDIENT.getValue(),
                                    PYRIDOXINE_HCL,
                                    1)))));

    Map<String, SnowstormConcept> browserMap = new LinkedHashMap<>();
    // a VTM that genuinely does not carry anything pyridoxine resolves to
    browserMap.put(VTM_B, conceptWith(VTM_B, Set.of(), Set.of(THIAMINE, RIBOFLAVIN)));
    browserMap.put(VMP_B, conceptWith(VMP_B, Set.of(VTM_B), Set.of(PYRIDOXINE_HCL)));
    browserMap.put(AMPOULE_2, ampoule2);

    ModelLevel vtmLevel = Mockito.mock(ModelLevel.class);
    Mockito.when(vtmLevel.getReferenceSetIdentifier()).thenReturn(VTM_REFSET);
    ModelLevel vmpLevel = Mockito.mock(ModelLevel.class);
    Mockito.when(vmpLevel.getReferenceSetIdentifier()).thenReturn(VMP_REFSET);

    ModelConfiguration modelConfiguration = Mockito.mock(ModelConfiguration.class);
    Mockito.when(modelConfiguration.getModelType()).thenReturn(ModelType.NMPC);
    Mockito.when(modelConfiguration.getLevelOfType(ModelLevelType.MEDICINAL_PRODUCT_ONLY))
        .thenReturn(vtmLevel);
    Mockito.when(modelConfiguration.getLevelOfType(ModelLevelType.CLINICAL_DRUG))
        .thenReturn(vmpLevel);
    Mockito.when(modelConfiguration.isExecuteEclAsStated()).thenReturn(true);

    Models models = Mockito.mock(Models.class);
    Mockito.when(models.getModelConfiguration(BRANCH)).thenReturn(modelConfiguration);

    SnowstormClient snowstormClient = Mockito.mock(SnowstormClient.class);
    Mockito.when(
            snowstormClient.getConceptsIdsFromEcl(
                Mockito.eq(BRANCH),
                Mockito.anyString(),
                Mockito.anyLong(),
                Mockito.anyInt(),
                Mockito.anyInt(),
                Mockito.anyBoolean()))
        .thenReturn(List.of(PYRIDOXINE_HCL, PYRIDOXINE));

    MedicationService service =
        new MedicationService(snowstormClient, models, Mockito.mock(FhirClient.class));

    // resolved outside the lambda so it contains a single call that can throw - the one under test
    Map<String, String> typeMap = typeMap();
    Set<SnowstormRelationship> productRelationships = getRelationshipsFromAxioms(ampoule2);

    assertThatThrownBy(
            () ->
                service.getActivePreciseIngredientMap(
                    BRANCH,
                    PACK,
                    ampoule2,
                    browserMap,
                    typeMap,
                    modelConfiguration,
                    productRelationships))
        .as("the count must be reported rather than left blank")
        .isInstanceOf(AtomicDataExtractionProblem.class)
        .hasMessageContaining("but found 0");
  }

  @Test
  void doesNotLoopForeverOnCircularStatedParents() {
    Map<String, SnowstormConcept> browserMap = new HashMap<>();
    browserMap.put("100", concept("100", "200"));
    browserMap.put("200", concept("200", "100"));

    assertThat(
            MedicationService.findModelLevelConceptForProduct(
                browserMap.get("100"), browserMap, typeMap(), VTM_REFSET))
        .isEqualTo(Optional.empty());
  }
}
