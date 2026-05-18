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
  void multiValueConcreteEmitsCardinalityNotInvalidOrList() {
    // Snowstorm's ECL grammar disallows `X != (#1.0 OR #2.0)` for concrete values. For
    // multi-value concrete attributes we instead emit `[N..N] X = *` so candidates carrying
    // additional values of the same attribute are excluded. Duplicate values across role groups
    // (e.g. two inner products with pack size #1.0) must collapse to a single distinct value.
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

    assertThat(ecl).doesNotContain("!=");
    assertThat(ecl).doesNotContain("#1.0 OR");
    assertThat(ecl).contains("[2..2] " + SnomedConstants.HAS_PACK_SIZE_VALUE.getValue() + " = *");
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
