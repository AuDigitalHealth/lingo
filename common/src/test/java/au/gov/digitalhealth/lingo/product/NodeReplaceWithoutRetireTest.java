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
package au.gov.digitalhealth.lingo.product;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.util.InactivationReason;
import org.junit.jupiter.api.Test;

class NodeReplaceWithoutRetireTest {

  private static final String AUTHORING_MODULE = "32506021000036107";
  private static final String SCT_CORE_MODULE = "900000000000207008";

  private static ModelLevel level() {
    ModelLevel modelLevel = new ModelLevel();
    modelLevel.setName("VMP");
    modelLevel.setDisplayLabel("VMP");
    modelLevel.setModelLevelType(ModelLevelType.CLINICAL_DRUG);
    return modelLevel;
  }

  private static Node existingNode(String conceptId, String moduleId) {
    SnowstormConceptMini concept =
        new SnowstormConceptMini().conceptId(conceptId).moduleId(moduleId);
    return new Node(concept, level());
  }

  private static Node newNodeWithOriginal(OriginalNode original) {
    Node node = new Node(null, level());
    NewConceptDetails details = new NewConceptDetails();
    details.setConceptId(-1);
    details.setFullySpecifiedName("New VMP (medicinal product)");
    details.setPreferredTerm("New VMP");
    node.setNewConceptDetails(details);
    node.setOriginalNode(original);
    return node;
  }

  @Test
  void externalOriginalConceptYieldsReplaceWithoutRetire() {
    Node original = existingNode("1296676008", SCT_CORE_MODULE);
    OriginalNode originalNode = new OriginalNode(original, null, false, AUTHORING_MODULE);

    assertTrue(originalNode.isExternalConcept());
    Node node = newNodeWithOriginal(originalNode);

    assertTrue(node.isReplaceWithoutRetire());
    assertFalse(node.isConceptEdit(), "Edit-in-place must not be allowed for external concepts");
    assertFalse(
        node.isRetireAndReplace(), "External concepts must never be retired and replaced");
    assertFalse(node.isNewConcept(), "Replace-without-retire is not a pure new concept");
  }

  @Test
  void externalConceptIsNotRetireAndReplaceEvenIfInactivationReasonSet() {
    Node original = existingNode("1296676008", SCT_CORE_MODULE);
    OriginalNode originalNode =
        new OriginalNode(original, InactivationReason.ERRONEOUS, false, AUTHORING_MODULE);

    Node node = newNodeWithOriginal(originalNode);

    assertFalse(node.isRetireAndReplace());
    assertTrue(node.isReplaceWithoutRetire());
  }

  @Test
  void internalConceptStillSupportsEditInPlace() {
    Node original = existingNode("1234567890", AUTHORING_MODULE);
    OriginalNode originalNode = new OriginalNode(original, null, false, AUTHORING_MODULE);

    assertFalse(originalNode.isExternalConcept());
    Node node = newNodeWithOriginal(originalNode);

    assertTrue(node.isConceptEdit());
    assertFalse(node.isReplaceWithoutRetire());
  }

  @Test
  void internalConceptWithInactivationReasonIsRetireAndReplace() {
    Node original = existingNode("1234567890", AUTHORING_MODULE);
    OriginalNode originalNode =
        new OriginalNode(original, InactivationReason.ERRONEOUS, false, AUTHORING_MODULE);

    Node node = newNodeWithOriginal(originalNode);

    assertTrue(node.isRetireAndReplace());
    assertFalse(node.isReplaceWithoutRetire());
    assertFalse(node.isConceptEdit());
  }

  @Test
  void externalConceptReferencedByOtherProductsIsNotReplaceWithoutRetire() {
    Node original = existingNode("1296676008", SCT_CORE_MODULE);
    OriginalNode originalNode = new OriginalNode(original, null, true, AUTHORING_MODULE);

    assertTrue(originalNode.isExternalConcept());

    Node node = newNodeWithOriginal(originalNode);

    assertFalse(node.isReplaceWithoutRetire());
    assertFalse(node.isConceptEdit());
    assertFalse(node.isRetireAndReplace());
  }

  @Test
  void nullAuthoringModuleTreatsConceptAsInternal() {
    Node original = existingNode("1296676008", SCT_CORE_MODULE);
    OriginalNode originalNode = new OriginalNode(original, null, false, (String) null);

    assertFalse(originalNode.isExternalConcept());
  }
}
