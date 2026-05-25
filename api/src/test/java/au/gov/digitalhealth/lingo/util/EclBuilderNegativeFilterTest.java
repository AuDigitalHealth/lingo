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

import static org.assertj.core.api.Assertions.assertThat;

import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelType;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

/**
 * Covers the regression where an MP-level ECL omitted HAS_TARGET_POPULATION from its negative
 * constraints, so candidate concepts carrying a target population still matched an atomic-data
 * shape without one — causing product updates that remove the target population to look like a
 * no-op.
 */
class EclBuilderNegativeFilterTest {

  private static final String MP_ROOT = "763158003";

  private static SnowstormRelationship isAMp() {
    SnowstormRelationship r = new SnowstormRelationship();
    r.setTypeId(SnomedConstants.IS_A.getValue());
    r.setDestinationId(MP_ROOT);
    r.setGroupId(0);
    return r;
  }

  private static SnowstormRelationship rel(String typeId, String destinationId, int group) {
    SnowstormRelationship r = new SnowstormRelationship();
    r.setTypeId(typeId);
    r.setDestinationId(destinationId);
    r.setGroupId(group);
    return r;
  }

  private static ModelConfiguration nmpcModel() {
    ModelConfiguration cfg = new ModelConfiguration();
    cfg.setModelType(ModelType.NMPC);
    cfg.setModuleId("11000220105");
    return cfg;
  }

  private static ModelLevel mpLevel() {
    ModelLevel level = new ModelLevel();
    level.setName("Virtual Therapeutic Moiety");
    level.setDisplayLabel("MP");
    level.setModelLevelType(ModelLevelType.MEDICINAL_PRODUCT_ONLY);
    return level;
  }

  @Test
  void mpEclExcludesCandidatesWithTargetPopulationWhenAtomicDataHasNone() {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(isAMp());
    relationships.add(rel(SnomedConstants.HAS_ACTIVE_INGREDIENT.getValue(), "1296750001", 1));

    String ecl = EclBuilder.build(relationships, Set.of(), false, false, nmpcModel(), mpLevel());

    assertThat(ecl)
        .as("ECL should forbid HAS_TARGET_POPULATION when not in the new atomic data")
        .contains("[0..0] " + SnomedConstants.HAS_TARGET_POPULATION.getValue() + " = *");
    assertThat(ecl)
        .as("ECL should also forbid PLAYS_ROLE on MP when not in atomic data (NMPC)")
        .contains("[0..0] " + SnomedConstants.PLAYS_ROLE.getValue() + " = *");
  }

  @Test
  void mpEclAllowsTargetPopulationValueWhenAtomicDataHasIt() {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(isAMp());
    relationships.add(rel(SnomedConstants.HAS_ACTIVE_INGREDIENT.getValue(), "1296750001", 1));
    relationships.add(rel(SnomedConstants.HAS_TARGET_POPULATION.getValue(), "27811000087103", 0));

    String ecl = EclBuilder.build(relationships, Set.of(), false, false, nmpcModel(), mpLevel());

    assertThat(ecl)
        .as("Atomic data has the attribute, so the [0..0] type = * form must not appear")
        .doesNotContain("[0..0] " + SnomedConstants.HAS_TARGET_POPULATION.getValue() + " = *");
    assertThat(ecl)
        .as("Other target populations must be excluded")
        .contains(
            "[0..0] " + SnomedConstants.HAS_TARGET_POPULATION.getValue() + " != 27811000087103");
  }

  @Test
  void multiValueConcreteEmitsOccurrenceCardinalityNotInvalidOrList() {
    // Snowstorm's ECL grammar disallows `X != (#1.0 OR #2.0)` for concrete values. For
    // multi-value concrete attributes we instead emit `[N..N] X = *` where N is the number of
    // source occurrences — NOT the number of distinct values. A source that legitimately has
    // duplicate pack-size values across role groups (e.g. two inner products both packaged in
    // 1mL containers, plus one in 2mL) must still match itself, so [3..3] is correct here, not
    // [2..2].
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(isAMp());
    relationships.add(packSizeValue("1.0", 1));
    relationships.add(packSizeValue("1.0", 2));
    relationships.add(packSizeValue("2.0", 3));

    ModelLevel packLevel = new ModelLevel();
    packLevel.setName("Branded Pack");
    packLevel.setDisplayLabel("TPP");
    packLevel.setModelLevelType(ModelLevelType.REAL_PACKAGED_CLINICAL_DRUG);

    ModelConfiguration amtModel = new ModelConfiguration();
    amtModel.setModelType(ModelType.AMT);
    amtModel.setModuleId("32506021000036107");

    String ecl = EclBuilder.build(relationships, Set.of(), false, false, amtModel, packLevel);

    assertThat(ecl).doesNotContain("#1.0 OR");
    assertThat(ecl).contains("[3..3] " + SnomedConstants.HAS_PACK_SIZE_VALUE.getValue() + " = *");
  }

  @Test
  void multiValueConceptEmitsOrNotEqualForm() {
    // Concept-valued attributes do support `X != (a OR b)` in Snowstorm ECL, so multi-ingredient
    // MP candidates with extra ingredients must be excluded that way.
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(isAMp());
    relationships.add(rel(SnomedConstants.HAS_ACTIVE_INGREDIENT.getValue(), "111", 1));
    relationships.add(rel(SnomedConstants.HAS_ACTIVE_INGREDIENT.getValue(), "222", 2));

    ModelLevel amtMp = new ModelLevel();
    amtMp.setName("Product");
    amtMp.setDisplayLabel("MP");
    amtMp.setModelLevelType(ModelLevelType.MEDICINAL_PRODUCT);

    ModelConfiguration amtModel = new ModelConfiguration();
    amtModel.setModelType(ModelType.AMT);
    amtModel.setModuleId("32506021000036107");

    String ecl = EclBuilder.build(relationships, Set.of(), false, false, amtModel, amtMp);

    assertThat(ecl)
        .contains("[0..0] " + SnomedConstants.HAS_ACTIVE_INGREDIENT.getValue() + " != (");
    // Order is non-deterministic; both orderings are acceptable.
    assertThat(ecl).containsAnyOf("(111 OR 222)", "(222 OR 111)");
  }

  private static SnowstormRelationship packSizeValue(String value, int group) {
    SnowstormRelationship r = new SnowstormRelationship();
    r.setTypeId(SnomedConstants.HAS_PACK_SIZE_VALUE.getValue());
    r.setConcreteValue(
        new au.csiro.snowstorm_client.model.SnowstormConcreteValue()
            .value(value)
            .dataType(au.csiro.snowstorm_client.model.SnowstormConcreteValue.DataTypeEnum.DECIMAL));
    r.setGroupId(group);
    return r;
  }

  /**
   * NMPC Medicinal VMP Template 2 ("Concentration Strength — No Unit of Presentation") has no
   * HAS_UNIT_OF_PRESENTATION relationship. The ECL filter must allow such candidates through
   * (positive filter is omitted because the form-driven addRelationshipIfNotNull omits the
   * relationship when the user doesn't supply a value) while excluding Template-1 candidates that
   * DO carry a UoP.
   */
  @Test
  void medicinalTemplate2OmitsUnitOfPresentationFilter() {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(isAMp());
    relationships.add(rel(SnomedConstants.HAS_ACTIVE_INGREDIENT.getValue(), "111", 1));
    // NO unit of presentation — Template 2 doesn't have one

    ModelLevel vmp = new ModelLevel();
    vmp.setName("VMP");
    vmp.setDisplayLabel("VMP");
    vmp.setModelLevelType(ModelLevelType.CLINICAL_DRUG);

    String ecl = EclBuilder.build(relationships, Set.of(), false, false, nmpcModel(), vmp);

    assertThat(ecl)
        .as("Template 2 lookup should still constrain absence of HAS_UNIT_OF_PRESENTATION")
        .contains("[0..0] " + SnomedConstants.HAS_UNIT_OF_PRESENTATION.getValue() + " = *");
  }

  /**
   * When a user supplies a unit of presentation (Template 1 or Template 3), the ECL emits the
   * positive filter and a value-exclusion negative filter so a candidate with a different unit of
   * presentation (e.g. vial vs syringe) is excluded.
   */
  @Test
  void nmpcVmpWithUnitOfPresentationExcludesOtherUnits() {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(isAMp());
    relationships.add(rel(SnomedConstants.HAS_ACTIVE_INGREDIENT.getValue(), "111", 1));
    relationships.add(rel(SnomedConstants.HAS_UNIT_OF_PRESENTATION.getValue(), "733026001", 0));

    ModelLevel vmp = new ModelLevel();
    vmp.setName("VMP");
    vmp.setDisplayLabel("VMP");
    vmp.setModelLevelType(ModelLevelType.CLINICAL_DRUG);

    String ecl = EclBuilder.build(relationships, Set.of(), false, false, nmpcModel(), vmp);

    assertThat(ecl)
        .as("Candidate with a different unit of presentation must be excluded")
        .contains(
            "[0..0] " + SnomedConstants.HAS_UNIT_OF_PRESENTATION.getValue() + " != 733026001");
  }

  /**
   * Vaccine Detailed template lacks HAS_UNIT_OF_PRESENTATION_SIZE_*, so a lookup without those
   * fields should not over-constrain the search for non-Detailed candidates.
   */
  @Test
  void vaccineDetailedTemplateOmitsUnitOfPresentationSizeFilters() {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(isAMp());
    relationships.add(rel(SnomedConstants.HAS_ACTIVE_INGREDIENT.getValue(), "1296750001", 1));
    relationships.add(rel(SnomedConstants.HAS_UNIT_OF_PRESENTATION.getValue(), "733026001", 0));
    // NO unit of presentation size — Vaccine Detailed doesn't have it

    ModelLevel vmp = new ModelLevel();
    vmp.setName("VMP");
    vmp.setDisplayLabel("VMP");
    vmp.setModelLevelType(ModelLevelType.CLINICAL_DRUG);

    String ecl = EclBuilder.build(relationships, Set.of(), false, false, nmpcModel(), vmp);

    assertThat(ecl)
        .contains(
            "[0..0] " + SnomedConstants.HAS_UNIT_OF_PRESENTATION_SIZE_QUANTITY.getValue() + " = *");
    assertThat(ecl)
        .contains(
            "[0..0] " + SnomedConstants.HAS_UNIT_OF_PRESENTATION_SIZE_UNIT.getValue() + " = *");
  }

  /**
   * Multi-ingredient NMPC VMP with BoSS — the BoSS values come through as a multi-value concept
   * filter, which uses the valid {@code [0..0] X != (a OR b)} form.
   */
  @Test
  void multiIngredientBossUsesOrNotEqualForm() {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(isAMp());
    relationships.add(rel(SnomedConstants.HAS_ACTIVE_INGREDIENT.getValue(), "111", 1));
    relationships.add(rel(SnomedConstants.HAS_BOSS.getValue(), "111", 1));
    relationships.add(rel(SnomedConstants.HAS_ACTIVE_INGREDIENT.getValue(), "222", 2));
    relationships.add(rel(SnomedConstants.HAS_BOSS.getValue(), "222", 2));

    ModelLevel vmp = new ModelLevel();
    vmp.setName("VMP");
    vmp.setDisplayLabel("VMP");
    vmp.setModelLevelType(ModelLevelType.CLINICAL_DRUG);

    String ecl = EclBuilder.build(relationships, Set.of(), false, false, nmpcModel(), vmp);

    assertThat(ecl).contains("[0..0] " + SnomedConstants.HAS_BOSS.getValue() + " != (");
    assertThat(ecl).containsAnyOf("(111 OR 222)", "(222 OR 111)");
  }

  @Test
  void noNegativeFiltersWhenSuppressedOrLevelMissing() {
    Set<SnowstormRelationship> relationships = new HashSet<>();
    relationships.add(isAMp());

    String suppressed =
        EclBuilder.build(relationships, Set.of(), false, true, nmpcModel(), mpLevel());
    assertThat(suppressed).doesNotContain("[0..0]");

    String noLevel = EclBuilder.build(relationships, Set.of(), false, false, nmpcModel(), null);
    assertThat(noLevel).doesNotContain("[0..0]");
  }
}
