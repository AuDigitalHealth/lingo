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
import java.util.Set;
import org.junit.jupiter.api.Test;

/**
 * Reproduces the axiom half of CUST1634236: when an existing product concept is edited in place
 * (same SCTID) and its defining relationships change (e.g. presentation strength), the concept view
 * sent to Snowstorm must reuse the existing class axiom's id so Snowstorm updates that OWL axiom
 * reference set member. Building a fresh axiom with no id makes Snowstorm retire the existing axiom
 * and create an entirely new one.
 */
class SnowstormDtoUtilAxiomEditTest {

  private static final String MODULE_ID = "11000168105";
  private static final String US_REFSET_ID = "900000000000509007";
  private static final String PRIMITIVE_ID = "900000000000074008";
  private static final String EXISTING_AXIOM_ID = "9bf3a1f0-0000-0000-0000-00000000abcd";

  @Test
  void editInPlaceReusesExistingAxiomId() {
    SnowstormConcept existing =
        new SnowstormConcept()
            .conceptId("74899007")
            .moduleId(MODULE_ID)
            .definitionStatus("PRIMITIVE")
            .active(true)
            .fsn(new SnowstormTermLangPojo().term("Old product (medicinal product)").lang("en"))
            .pt(new SnowstormTermLangPojo().term("Old product").lang("en"))
            .classAxioms(
                Set.of(
                    axiom(
                        EXISTING_AXIOM_ID,
                        relationship("762949000", "111115")))); // old strength value

    // Recalculated edit: new axiom (no id) with the changed defining relationship value.
    NewConceptDetails details = new NewConceptDetails();
    details.setConceptId(-1);
    details.setSpecifiedConceptId("74899007");
    details.setFullySpecifiedName("New product (medicinal product)");
    details.setPreferredTerm("New product");
    details.setSemanticTag("medicinal product");
    details.setAxioms(Set.of(axiom(null, relationship("762949000", "222225")))); // new strength

    Node node = new Node(null, level());
    node.setNewConceptDetails(details);

    SnowstormConceptView view = SnowstormDtoUtil.toSnowstormConceptView(node, model(), existing);

    SnowstormAxiom resultAxiom = SnowstormDtoUtil.getSingleAxiom(view);
    assertEquals(
        EXISTING_AXIOM_ID,
        resultAxiom.getAxiomId(),
        "edit-in-place must reuse the existing axiom id so Snowstorm updates the axiom in place"
            + " rather than retiring it and creating a new one");
  }

  private static SnowstormAxiom axiom(String axiomId, SnowstormRelationship relationship) {
    SnowstormAxiom axiom = new SnowstormAxiom();
    axiom.setAxiomId(axiomId);
    axiom.setActive(true);
    axiom.setReleased(axiomId != null);
    axiom.setModuleId(MODULE_ID);
    axiom.setDefinitionStatus("PRIMITIVE");
    axiom.setDefinitionStatusId(PRIMITIVE_ID);
    axiom.setRelationships(new java.util.HashSet<>(Set.of(relationship)));
    return axiom;
  }

  private static SnowstormRelationship relationship(String typeId, String destinationId) {
    SnowstormRelationship relationship = new SnowstormRelationship();
    relationship.setActive(true);
    relationship.setTypeId(typeId);
    relationship.setDestinationId(destinationId);
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
    modelLevel.setModelLevelType(ModelLevelType.CLINICAL_DRUG);
    return modelLevel;
  }
}
