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

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormConceptView;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelType;
import au.gov.digitalhealth.lingo.product.NewConceptDetails;
import au.gov.digitalhealth.lingo.product.Node;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

/**
 * The concept view sent to Snowstorm carries its own definitionStatusId, derived from the axioms
 * being created. That derivation compared the SCTID {@code DEFINED.getValue()} against the axiom's
 * {@code definitionStatus}, which holds a name rather than an SCTID, so it never matched and every
 * new concept was persisted PRIMITIVE no matter how its axiom was modelled.
 *
 * <p>The create response hid the bug: {@code ProductCreationService} copies the definition status
 * back onto the returned concept from the axiom, which was correct all along, so a fully defined
 * VMPP/AMPP looked right immediately after creation and only reverted to Primitive on reload, when
 * the value Snowstorm actually stored was read back.
 */
class SnowstormDtoUtilDefinitionStatusTest {

  private static final String MODULE_ID = "11000168105";
  private static final String US_REFSET_ID = "900000000000509007";
  private static final String DEFINED_ID = "900000000000073002";
  private static final String PRIMITIVE_ID = "900000000000074008";

  @Test
  void fullyDefinedAxiomYieldsFullyDefinedConcept() {
    SnowstormConceptView view = toConceptView(axiom(DEFINED_ID, "FULLY_DEFINED"));

    assertEquals(
        DEFINED_ID,
        view.getDefinitionStatusId(),
        "a fully defined axiom must persist a fully defined concept - comparing the SCTID against"
            + " the axiom's definitionStatus name always failed, silently forcing PRIMITIVE onto"
            + " every concept written to Snowstorm");
  }

  @Test
  void primitiveAxiomYieldsPrimitiveConcept() {
    SnowstormConceptView view = toConceptView(axiom(PRIMITIVE_ID, "PRIMITIVE"));

    assertEquals(PRIMITIVE_ID, view.getDefinitionStatusId());
  }

  @Test
  void editInPlaceOfExistingConceptKeepsFullyDefined() {
    SnowstormConcept existing =
        new SnowstormConcept()
            .conceptId("74899007")
            .moduleId(MODULE_ID)
            .definitionStatus("PRIMITIVE")
            .definitionStatusId(PRIMITIVE_ID)
            .active(true)
            .descriptions(new HashSet<>())
            .fsn(new SnowstormTermLangPojo().term("Old pack (medicinal product)").lang("en"))
            .pt(new SnowstormTermLangPojo().term("Old pack").lang("en"))
            .classAxioms(new HashSet<>(Set.of(axiom(PRIMITIVE_ID, "PRIMITIVE"))));

    Node node = new Node(null, level());
    node.setNewConceptDetails(details(axiom(DEFINED_ID, "FULLY_DEFINED")));

    SnowstormConceptView view = SnowstormDtoUtil.toSnowstormConceptView(node, model(), existing);

    assertEquals(
        DEFINED_ID,
        view.getDefinitionStatusId(),
        "recalculating an existing pack to fully defined must persist that, not inherit the"
            + " existing concept's Primitive status");
  }

  private static SnowstormConceptView toConceptView(SnowstormAxiom axiom) {
    Node node = new Node(null, level());
    node.setNewConceptDetails(details(axiom));
    return SnowstormDtoUtil.toSnowstormConceptView(node, model());
  }

  private static NewConceptDetails details(SnowstormAxiom axiom) {
    NewConceptDetails details = new NewConceptDetails();
    details.setConceptId(-1);
    details.setFullySpecifiedName("A pack (medicinal product)");
    details.setPreferredTerm("A pack");
    details.setSemanticTag("medicinal product");
    details.setAxioms(new HashSet<>(Set.of(axiom)));
    return details;
  }

  private static SnowstormAxiom axiom(String definitionStatusId, String definitionStatus) {
    SnowstormAxiom axiom = new SnowstormAxiom();
    axiom.setActive(true);
    axiom.setReleased(false);
    axiom.setModuleId(MODULE_ID);
    axiom.setDefinitionStatusId(definitionStatusId);
    axiom.setDefinitionStatus(definitionStatus);
    axiom.setRelationships(new HashSet<>(Set.of(relationship())));
    return axiom;
  }

  private static SnowstormRelationship relationship() {
    SnowstormRelationship relationship = new SnowstormRelationship();
    relationship.setActive(true);
    relationship.setTypeId("116680003");
    relationship.setDestinationId("781405001");
    return relationship;
  }

  private static ModelConfiguration model() {
    ModelConfiguration cfg = new ModelConfiguration();
    cfg.setModelType(ModelType.NMPC);
    cfg.setModuleId(MODULE_ID);
    cfg.setPreferredLanguageRefsets(Set.of(US_REFSET_ID));
    return cfg;
  }

  private static ModelLevel level() {
    ModelLevel modelLevel = new ModelLevel();
    modelLevel.setName("CTPP");
    modelLevel.setDisplayLabel("CTPP");
    modelLevel.setModelLevelType(ModelLevelType.PACKAGED_CLINICAL_DRUG);
    return modelLevel;
  }
}
