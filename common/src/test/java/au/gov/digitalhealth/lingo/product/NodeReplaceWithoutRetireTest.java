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
    OriginalNode originalNode = OriginalNode.of(original, null, false, AUTHORING_MODULE);

    assertTrue(originalNode.isExternalConcept());
    Node node = newNodeWithOriginal(originalNode);

    assertTrue(node.isReplaceWithoutRetire());
    assertFalse(node.isConceptEdit(), "Edit-in-place must not be allowed for external concepts");
    assertFalse(
        node.isRetireAndReplace(), "External concepts must never be retired and replaced");
    assertFalse(node.isNewConcept(), "Replace-without-retire is not a pure new concept");
  }

  @Test
  void externalConceptWithStrayInactivationReasonFiresNoOperation() {
    // The normal flow nulls the inactivation reason for external concepts. If the bad state
    // (external + inactivationReason set) is reached through a bug or hostile payload, the
    // node must not match any operation predicate — the server-side validator then rejects the
    // payload before any concept changes are made. See `validateUpdateOperation` in
    // ProductCreationService.
    Node original = existingNode("1296676008", SCT_CORE_MODULE);
    OriginalNode originalNode =
        OriginalNode.of(original, InactivationReason.ERRONEOUS, false, AUTHORING_MODULE);

    Node node = newNodeWithOriginal(originalNode);

    assertFalse(node.isRetireAndReplace());
    assertFalse(node.isRetireAndReplaceWithExisting());
    assertFalse(node.isConceptEdit());
    assertFalse(node.isReplaceWithoutRetire());
    assertFalse(node.isNewConcept());
  }

  @Test
  void internalConceptStillSupportsEditInPlace() {
    Node original = existingNode("1234567890", AUTHORING_MODULE);
    OriginalNode originalNode = OriginalNode.of(original, null, false, AUTHORING_MODULE);

    assertFalse(originalNode.isExternalConcept());
    Node node = newNodeWithOriginal(originalNode);

    assertTrue(node.isConceptEdit());
    assertFalse(node.isReplaceWithoutRetire());
  }

  @Test
  void internalConceptWithInactivationReasonIsRetireAndReplace() {
    Node original = existingNode("1234567890", AUTHORING_MODULE);
    OriginalNode originalNode =
        OriginalNode.of(original, InactivationReason.ERRONEOUS, false, AUTHORING_MODULE);

    Node node = newNodeWithOriginal(originalNode);

    assertTrue(node.isRetireAndReplace());
    assertFalse(node.isReplaceWithoutRetire());
    assertFalse(node.isConceptEdit());
  }

  @Test
  void externalConceptReferencedByOtherProductsIsNotReplaceWithoutRetire() {
    Node original = existingNode("1296676008", SCT_CORE_MODULE);
    OriginalNode originalNode = OriginalNode.of(original, null, true, AUTHORING_MODULE);

    assertTrue(originalNode.isExternalConcept());

    Node node = newNodeWithOriginal(originalNode);

    assertFalse(node.isReplaceWithoutRetire());
    assertFalse(node.isConceptEdit());
    assertFalse(node.isRetireAndReplace());
  }

  @Test
  void externalConceptWithInactivationReasonFailsBeanValidation() {
    // Belt-and-braces: the OriginalNode's @AssertTrue invariant makes the bad state
    // (externalConcept + inactivationReason) representable but reportable, so any @Valid
    // boundary catches it even if the predicate dispatch silently drops it.
    Node original = existingNode("1296676008", SCT_CORE_MODULE);
    OriginalNode bad =
        OriginalNode.of(original, InactivationReason.ERRONEOUS, false, AUTHORING_MODULE);

    try (jakarta.validation.ValidatorFactory factory =
        jakarta.validation.Validation.buildDefaultValidatorFactory()) {
      jakarta.validation.Validator validator = factory.getValidator();
      java.util.Set<jakarta.validation.ConstraintViolation<OriginalNode>> violations =
          validator.validate(bad);
      assertTrue(
          violations.stream()
              .anyMatch(
                  v -> v.getMessage().contains("external original concept cannot carry an inactivation")),
          "Expected @AssertTrue invariant to fire on external + inactivationReason; got "
              + violations);
    }
  }

  @Test
  void missingConceptModuleIdIsHardError() {
    SnowstormConceptMini concept = new SnowstormConceptMini().conceptId("1296676008");
    // moduleId not set — simulates a malformed Snowstorm response
    Node original = new Node(concept, level());

    org.junit.jupiter.api.Assertions.assertThrows(
        au.gov.digitalhealth.lingo.exception.LingoProblem.class,
        () -> OriginalNode.of(original, null, false, AUTHORING_MODULE),
        "Missing moduleId should fail loudly rather than silently treat the concept as internal");
  }

  @Test
  void nullOriginalConceptIsHardError() {
    Node nodeWithNullConcept = new Node(null, level());

    org.junit.jupiter.api.Assertions.assertThrows(
        au.gov.digitalhealth.lingo.exception.LingoProblem.class,
        () -> OriginalNode.of(nodeWithNullConcept, null, false, AUTHORING_MODULE),
        "OriginalNode requires a concept on the original node");
  }

  @Test
  void nullAuthoringModuleTreatsConceptAsInternal() {
    Node original = existingNode("1296676008", SCT_CORE_MODULE);
    OriginalNode originalNode = OriginalNode.of(original, null, false, (String) null);

    assertFalse(originalNode.isExternalConcept());
  }

  /**
   * The five operation predicates ({@code isNewConcept}, {@code isConceptEdit}, {@code
   * isRetireAndReplace}, {@code isRetireAndReplaceWithExisting}, {@code isReplaceWithoutRetire})
   * are intended to be mutually exclusive — each represents a distinct authoring operation and
   * downstream services dispatch on them. Enumerate the reachable {@code Node} state space and
   * assert at most one predicate ever fires.
   */
  @Test
  void operationPredicatesAreMutuallyExclusive() {
    for (boolean hasConcept : new boolean[] {true, false}) {
      for (boolean hasNewConceptDetails : new boolean[] {true, false}) {
        if (hasConcept && hasNewConceptDetails) {
          continue; // @OnlyOnePopulated invariant: a node can't carry both
        }
        for (boolean hasOriginal : new boolean[] {true, false}) {
          for (boolean external : new boolean[] {true, false}) {
            for (boolean referenced : new boolean[] {true, false}) {
              for (InactivationReason reason :
                  new InactivationReason[] {null, InactivationReason.ERRONEOUS}) {
                Node node = new Node(null, level());
                if (hasConcept) {
                  node.setConcept(new SnowstormConceptMini().conceptId("999").moduleId("anymod"));
                }
                if (hasNewConceptDetails) {
                  NewConceptDetails ncd = new NewConceptDetails();
                  ncd.setConceptId(-1);
                  ncd.setFullySpecifiedName("New (medicinal product)");
                  ncd.setPreferredTerm("New");
                  node.setNewConceptDetails(ncd);
                }
                if (hasOriginal) {
                  // Drive externality via the original concept's moduleId, which is what
                  // `OriginalNode.of` consults — there's no public setter for the flag.
                  Node originalConceptNode =
                      existingNode("111", external ? SCT_CORE_MODULE : AUTHORING_MODULE);
                  OriginalNode on =
                      OriginalNode.of(originalConceptNode, reason, referenced, AUTHORING_MODULE);
                  node.setOriginalNode(on);
                }

                long fired =
                    java.util.stream.Stream.of(
                            node.isNewConcept(),
                            node.isConceptEdit(),
                            node.isRetireAndReplace(),
                            node.isRetireAndReplaceWithExisting(),
                            node.isReplaceWithoutRetire())
                        .filter(Boolean::booleanValue)
                        .count();

                assertTrue(
                    fired <= 1,
                    "Predicates must be mutually exclusive but "
                        + fired
                        + " fired for state {hasConcept="
                        + hasConcept
                        + ", hasNewConceptDetails="
                        + hasNewConceptDetails
                        + ", hasOriginal="
                        + hasOriginal
                        + ", external="
                        + external
                        + ", referenced="
                        + referenced
                        + ", reason="
                        + reason
                        + "}");
              }
            }
          }
        }
      }
    }
  }
}
