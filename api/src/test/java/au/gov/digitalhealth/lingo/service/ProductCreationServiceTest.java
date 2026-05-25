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

import static au.gov.digitalhealth.lingo.util.SnomedConstants.ADDITIONAL_RELATIONSHIP;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CONCEPT_INACTIVATION_INDICATOR_REFERENCE_SET;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormConcreteValue;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.product.NewConceptDetails;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.OriginalNode;
import au.gov.digitalhealth.lingo.util.HistoricalAssociationReferenceSet;
import au.gov.digitalhealth.lingo.util.InactivationReason;
import java.lang.reflect.Method;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

/** Unit tests for ProductCreationService focusing on relationship reactivation logic. */
class ProductCreationServiceTest {

  // Test data constants
  private static final String TEST_TYPE_ID_1 = "123456";
  private static final String TEST_DESTINATION_ID_1 = "789012";
  private static final String TEST_TYPE_ID_2 = "999999";
  private static final String TEST_DESTINATION_ID_2 = "888888";
  private static final SnowstormConcreteValue TEST_CONCRETE_VALUE =
      new SnowstormConcreteValue().value("100");
  private static final String NON_ADDITIONAL_RELATIONSHIP_TYPE = "SOME_OTHER_TYPE";

  /**
   * Helper method to invoke the private updateConceptNonDefiningRelationships method using
   * reflection.
   */
  private boolean invokeUpdateConceptNonDefiningRelationships(
      Set<SnowstormRelationship> existingRelationships, Set<SnowstormRelationship> newRelationships)
      throws Exception {
    Method method =
        ProductCreationService.class.getDeclaredMethod(
            "updateConceptNonDefiningRelationships", Set.class, Set.class);
    method.setAccessible(true);
    return (boolean) method.invoke(null, existingRelationships, newRelationships);
  }

  /**
   * Test that an inactive ADDITIONAL_RELATIONSHIP is correctly reactivated when a matching new
   * relationship is provided.
   */
  @Test
  void testReactivateInactiveAdditionalRelationship() throws Exception {
    // Create an inactive ADDITIONAL_RELATIONSHIP
    SnowstormRelationship inactiveRelationship = new SnowstormRelationship();
    inactiveRelationship.setCharacteristicType(ADDITIONAL_RELATIONSHIP.getValue());
    inactiveRelationship.setActive(false);
    inactiveRelationship.setTypeId(TEST_TYPE_ID_1);
    inactiveRelationship.setDestinationId(TEST_DESTINATION_ID_1);

    Set<SnowstormRelationship> existingRelationships = new HashSet<>();
    existingRelationships.add(inactiveRelationship);

    // Create a new relationship that matches the inactive one
    SnowstormRelationship newRelationship = new SnowstormRelationship();
    newRelationship.setTypeId(TEST_TYPE_ID_1);
    newRelationship.setDestinationId(TEST_DESTINATION_ID_1);

    Set<SnowstormRelationship> newRelationships = new HashSet<>();
    newRelationships.add(newRelationship);

    // Invoke the private method using reflection
    boolean result =
        invokeUpdateConceptNonDefiningRelationships(existingRelationships, newRelationships);

    // Verify that the relationship was reactivated
    assertThat(result).isTrue();
    assertThat(inactiveRelationship.getActive()).isTrue();
    assertThat(existingRelationships).hasSize(1);
  }

  /** Test that no duplicate relationships are created when reactivating. */
  @Test
  void testNoDuplicateRelationshipsWhenReactivating() throws Exception {
    // Create an inactive ADDITIONAL_RELATIONSHIP
    SnowstormRelationship inactiveRelationship = new SnowstormRelationship();
    inactiveRelationship.setCharacteristicType(ADDITIONAL_RELATIONSHIP.getValue());
    inactiveRelationship.setActive(false);
    inactiveRelationship.setTypeId(TEST_TYPE_ID_1);
    inactiveRelationship.setDestinationId(TEST_DESTINATION_ID_1);

    Set<SnowstormRelationship> existingRelationships = new HashSet<>();
    existingRelationships.add(inactiveRelationship);

    // Create a new relationship that matches the inactive one
    SnowstormRelationship newRelationship = new SnowstormRelationship();
    newRelationship.setTypeId(TEST_TYPE_ID_1);
    newRelationship.setDestinationId(TEST_DESTINATION_ID_1);

    Set<SnowstormRelationship> newRelationships = new HashSet<>();
    newRelationships.add(newRelationship);

    // Invoke the private method using reflection
    invokeUpdateConceptNonDefiningRelationships(existingRelationships, newRelationships);

    // Verify that no duplicate was created - still only one relationship
    assertThat(existingRelationships).hasSize(1);
    assertThat(existingRelationships.iterator().next().getActive()).isTrue();
  }

  /** Test that the method returns true when relationships are reactivated. */
  @Test
  void testMethodReturnsTrueWhenRelationshipsReactivated() throws Exception {
    // Create an inactive ADDITIONAL_RELATIONSHIP
    SnowstormRelationship inactiveRelationship = new SnowstormRelationship();
    inactiveRelationship.setCharacteristicType(ADDITIONAL_RELATIONSHIP.getValue());
    inactiveRelationship.setActive(false);
    inactiveRelationship.setTypeId(TEST_TYPE_ID_1);
    inactiveRelationship.setDestinationId(TEST_DESTINATION_ID_1);

    Set<SnowstormRelationship> existingRelationships = new HashSet<>();
    existingRelationships.add(inactiveRelationship);

    // Create a new relationship that matches the inactive one
    SnowstormRelationship newRelationship = new SnowstormRelationship();
    newRelationship.setTypeId(TEST_TYPE_ID_1);
    newRelationship.setDestinationId(TEST_DESTINATION_ID_1);

    Set<SnowstormRelationship> newRelationships = new HashSet<>();
    newRelationships.add(newRelationship);

    // Invoke the private method using reflection
    boolean result =
        invokeUpdateConceptNonDefiningRelationships(existingRelationships, newRelationships);

    // Verify that the method returns true when a relationship is reactivated
    assertThat(result).isTrue();
  }

  /**
   * Test that the method returns true when an active ADDITIONAL_RELATIONSHIP is removed because it
   * is not in the new relationships.
   */
  @Test
  void testMethodReturnsTrueWhenActiveRelationshipRemoved() throws Exception {
    // Create an active ADDITIONAL_RELATIONSHIP
    SnowstormRelationship activeRelationship = new SnowstormRelationship();
    activeRelationship.setCharacteristicType(ADDITIONAL_RELATIONSHIP.getValue());
    activeRelationship.setActive(true);
    activeRelationship.setTypeId(TEST_TYPE_ID_1);
    activeRelationship.setDestinationId(TEST_DESTINATION_ID_1);

    Set<SnowstormRelationship> existingRelationships = new HashSet<>();
    existingRelationships.add(activeRelationship);

    // No new relationships to add
    Set<SnowstormRelationship> newRelationships = new HashSet<>();

    // Invoke the private method using reflection
    boolean result =
        invokeUpdateConceptNonDefiningRelationships(existingRelationships, newRelationships);

    // Verify that the method returns true because the active relationship is removed
    assertThat(result).isTrue();
    assertThat(existingRelationships).isEmpty();
  }

  /** Test reactivation with concrete value instead of destination ID. */
  @Test
  void testReactivateInactiveRelationshipWithConcreteValue() throws Exception {
    // Create an inactive ADDITIONAL_RELATIONSHIP with concrete value
    SnowstormRelationship inactiveRelationship = new SnowstormRelationship();
    inactiveRelationship.setCharacteristicType(ADDITIONAL_RELATIONSHIP.getValue());
    inactiveRelationship.setActive(false);
    inactiveRelationship.setTypeId(TEST_TYPE_ID_1);
    inactiveRelationship.setConcreteValue(TEST_CONCRETE_VALUE);

    Set<SnowstormRelationship> existingRelationships = new HashSet<>();
    existingRelationships.add(inactiveRelationship);

    // Create a new relationship that matches the inactive one
    SnowstormRelationship newRelationship = new SnowstormRelationship();
    newRelationship.setTypeId(TEST_TYPE_ID_1);
    newRelationship.setConcreteValue(TEST_CONCRETE_VALUE);

    Set<SnowstormRelationship> newRelationships = new HashSet<>();
    newRelationships.add(newRelationship);

    // Invoke the private method using reflection
    boolean result =
        invokeUpdateConceptNonDefiningRelationships(existingRelationships, newRelationships);

    // Verify that the relationship was reactivated
    assertThat(result).isTrue();
    assertThat(inactiveRelationship.getActive()).isTrue();
    assertThat(existingRelationships).hasSize(1);
  }

  /**
   * Test that a new relationship is added when no matching inactive or active relationship exists.
   */
  @Test
  void testAddNewRelationshipWhenNoMatchExists() throws Exception {
    Set<SnowstormRelationship> existingRelationships = new HashSet<>();

    // Create a new relationship
    SnowstormRelationship newRelationship = new SnowstormRelationship();
    newRelationship.setTypeId(TEST_TYPE_ID_1);
    newRelationship.setDestinationId(TEST_DESTINATION_ID_1);

    Set<SnowstormRelationship> newRelationships = new HashSet<>();
    newRelationships.add(newRelationship);

    // Invoke the private method using reflection
    boolean result =
        invokeUpdateConceptNonDefiningRelationships(existingRelationships, newRelationships);

    // Verify that the new relationship was added
    assertThat(result).isTrue();
    assertThat(existingRelationships).hasSize(1);
    assertThat(existingRelationships.iterator().next()).isEqualTo(newRelationship);
  }

  /**
   * Test that active ADDITIONAL_RELATIONSHIP relationships are removed if not in new relationships.
   */
  @Test
  void testRemoveActiveRelationshipNotInNewRelationships() throws Exception {
    // Create an active ADDITIONAL_RELATIONSHIP
    SnowstormRelationship activeRelationship = new SnowstormRelationship();
    activeRelationship.setCharacteristicType(ADDITIONAL_RELATIONSHIP.getValue());
    activeRelationship.setActive(true);
    activeRelationship.setTypeId(TEST_TYPE_ID_1);
    activeRelationship.setDestinationId(TEST_DESTINATION_ID_1);

    Set<SnowstormRelationship> existingRelationships = new HashSet<>();
    existingRelationships.add(activeRelationship);

    // Create new relationships that don't match the active one
    SnowstormRelationship newRelationship = new SnowstormRelationship();
    newRelationship.setTypeId(TEST_TYPE_ID_2);
    newRelationship.setDestinationId(TEST_DESTINATION_ID_2);

    Set<SnowstormRelationship> newRelationships = new HashSet<>();
    newRelationships.add(newRelationship);

    // Invoke the private method using reflection
    boolean result =
        invokeUpdateConceptNonDefiningRelationships(existingRelationships, newRelationships);

    // Verify that the active relationship was removed and the new one was added
    assertThat(result).isTrue();
    assertThat(existingRelationships).hasSize(1);
    assertThat(existingRelationships.iterator().next().getTypeId()).isEqualTo(TEST_TYPE_ID_2);
  }

  /** Test that the method returns false when no relationships need to be modified. */
  @Test
  void testMethodReturnsFalseWhenNoModificationsNeeded() throws Exception {
    // Create an inactive relationship (not ADDITIONAL_RELATIONSHIP characteristic type)
    SnowstormRelationship inactiveOtherRelationship = new SnowstormRelationship();
    inactiveOtherRelationship.setCharacteristicType(NON_ADDITIONAL_RELATIONSHIP_TYPE);
    inactiveOtherRelationship.setActive(false);
    inactiveOtherRelationship.setTypeId(TEST_TYPE_ID_1);
    inactiveOtherRelationship.setDestinationId(TEST_DESTINATION_ID_1);

    Set<SnowstormRelationship> existingRelationships = new HashSet<>();
    existingRelationships.add(inactiveOtherRelationship);

    // Empty new relationships set
    Set<SnowstormRelationship> newRelationships = new HashSet<>();

    // Invoke the private method using reflection
    boolean result =
        invokeUpdateConceptNonDefiningRelationships(existingRelationships, newRelationships);

    // Verify that the method returns false because no modifications were made
    // (the inactive relationship is not an ADDITIONAL_RELATIONSHIP so it's not removed)
    assertThat(result).isFalse();
    assertThat(existingRelationships).hasSize(1);
  }

  // ------------------------------------------------------------------------------------------
  // buildInactivationAndAssociationMembers — invariant: external (replace-without-retire) nodes
  // must NOT produce inactivation-indicator or historical-association refset members. Only the
  // refset cleanup (handled separately, in the caller) applies to those.
  // ------------------------------------------------------------------------------------------

  private static final String AUTHORING_MODULE = "32506021000036107";
  private static final String SCT_CORE_MODULE = "900000000000207008";

  private static ModelLevel vmpLevel() {
    ModelLevel level = new ModelLevel();
    level.setName("VMP");
    level.setDisplayLabel("VMP");
    level.setModelLevelType(ModelLevelType.CLINICAL_DRUG);
    return level;
  }

  private static Node existingNode(String conceptId, String moduleId) {
    // Default to a released concept: effectiveTime non-null signals the concept has been versioned
    // in a Snowstorm release, which is the steady state for any external/AMT/NMPC concept loaded
    // from Snowstorm. Tests that need to exercise the unreleased path use existingUnreleasedNode.
    SnowstormConceptMini concept =
        new SnowstormConceptMini()
            .conceptId(conceptId)
            .moduleId(moduleId)
            .effectiveTime("20240101");
    return new Node(concept, vmpLevel());
  }

  private static Node existingUnreleasedNode(String conceptId, String moduleId) {
    // Unreleased: effectiveTime null — simulates a concept that was created in the current
    // authoring task but never versioned, and so cannot be PUT-inactivated by Snowstorm.
    SnowstormConceptMini concept =
        new SnowstormConceptMini().conceptId(conceptId).moduleId(moduleId);
    return new Node(concept, vmpLevel());
  }

  private static Node nodeWithNewConceptDetails(OriginalNode originalNode) {
    Node node = new Node(null, vmpLevel());
    NewConceptDetails details = new NewConceptDetails();
    details.setConceptId(-42);
    details.setFullySpecifiedName("New replacement (medicinal product)");
    details.setPreferredTerm("New replacement");
    node.setNewConceptDetails(details);
    node.setOriginalNode(originalNode);
    return node;
  }

  @Test
  void retireAndReplaceNodeEmitsInactivationAndHistoricalAssociationMembers() {
    Node original = existingNode("1234567890", AUTHORING_MODULE);
    OriginalNode originalNode =
        OriginalNode.of(original, InactivationReason.ERRONEOUS, false, AUTHORING_MODULE);
    Node retireAndReplaceNode = nodeWithNewConceptDetails(originalNode);
    assertThat(retireAndReplaceNode.isRetireAndReplace()).isTrue();

    List<SnowstormReferenceSetMemberViewComponent> members =
        ProductCreationService.buildInactivationAndAssociationMembers(Set.of(retireAndReplaceNode));

    assertThat(members).hasSize(2);
    assertThat(members)
        .anyMatch(
            m ->
                CONCEPT_INACTIVATION_INDICATOR_REFERENCE_SET.getValue().equals(m.getRefsetId())
                    && "1234567890".equals(m.getReferencedComponentId())
                    && InactivationReason.ERRONEOUS
                        .getValue()
                        .equals(m.getAdditionalFields().get("valueId")));
    assertThat(members)
        .anyMatch(
            m ->
                HistoricalAssociationReferenceSet.REPLACED_BY.getValue().equals(m.getRefsetId())
                    && "1234567890".equals(m.getReferencedComponentId()));
  }

  @Test
  void replaceWithoutRetireNodeMustNotBePassedToInactivationMemberBuilder() {
    // External concept → replace-without-retire. Calling the inactivation-member builder for
    // such a node is a programmer error: external concepts must never have inactivation
    // indicators or historical associations recorded against them.
    Node original = existingNode("1296676008", SCT_CORE_MODULE);
    OriginalNode externalOriginalNode = OriginalNode.of(original, null, false, AUTHORING_MODULE);
    Node replaceWithoutRetireNode = nodeWithNewConceptDetails(externalOriginalNode);
    assertThat(replaceWithoutRetireNode.isReplaceWithoutRetire()).isTrue();
    assertThat(replaceWithoutRetireNode.isRetireAndReplace()).isFalse();
    assertThat(replaceWithoutRetireNode.isRetireAndReplaceWithExisting()).isFalse();

    assertThatThrownBy(
            () ->
                ProductCreationService.buildInactivationAndAssociationMembers(
                    Set.of(replaceWithoutRetireNode)))
        .isInstanceOf(IllegalStateException.class);
  }

  @Test
  void emptyRetireAndReplaceSetProducesNoMembers() {
    List<SnowstormReferenceSetMemberViewComponent> members =
        ProductCreationService.buildInactivationAndAssociationMembers(Set.of());

    assertThat(members).isEmpty();
  }

  @Test
  void unreleasedOriginalEmitsNoInactivationOrAssociationMembers() {
    // An unreleased original (effectiveTime null) is going to be DELETEd by createOrUpdateConcepts
    // rather than PUT-inactivated. Inactivation-indicator and historical-association refset
    // members on a concept that will be deleted are pointless — Snowstorm cascades the delete and
    // those members would either fail to write or be immediately orphaned. The builder must
    // silently skip such nodes.
    Node original = existingUnreleasedNode("1234567890", AUTHORING_MODULE);
    OriginalNode originalNode =
        OriginalNode.of(original, InactivationReason.ERRONEOUS, false, AUTHORING_MODULE);
    Node retireAndReplaceNode = nodeWithNewConceptDetails(originalNode);
    assertThat(retireAndReplaceNode.isRetireAndReplace()).isTrue();

    List<SnowstormReferenceSetMemberViewComponent> members =
        ProductCreationService.buildInactivationAndAssociationMembers(Set.of(retireAndReplaceNode));

    assertThat(members)
        .as(
            "Unreleased originals are deleted not inactivated; no inactivation indicator or"
                + " historical association should be written for them")
        .isEmpty();
  }

  @Test
  void mixedReleasedAndUnreleasedRetireAndReplaceFiltersOnlyUnreleased() {
    // Belt and braces: when a batch contains both released and unreleased originals, only the
    // released ones get inactivation-indicator and historical-association members.
    Node releasedOriginal = existingNode("1111111111", AUTHORING_MODULE);
    OriginalNode releasedOriginalNode =
        OriginalNode.of(releasedOriginal, InactivationReason.ERRONEOUS, false, AUTHORING_MODULE);
    Node releasedNode = nodeWithNewConceptDetails(releasedOriginalNode);

    Node unreleasedOriginal = existingUnreleasedNode("2222222222", AUTHORING_MODULE);
    OriginalNode unreleasedOriginalNode =
        OriginalNode.of(unreleasedOriginal, InactivationReason.ERRONEOUS, false, AUTHORING_MODULE);
    Node unreleasedNode = nodeWithNewConceptDetails(unreleasedOriginalNode);

    List<SnowstormReferenceSetMemberViewComponent> members =
        ProductCreationService.buildInactivationAndAssociationMembers(
            Set.of(releasedNode, unreleasedNode));

    // Two members per released original (inactivation indicator + historical association); zero
    // for the unreleased one.
    assertThat(members).hasSize(2);
    assertThat(members).allMatch(m -> "1111111111".equals(m.getReferencedComponentId()));
  }

  // ------------------------------------------------------------------------------------------
  // normaliseExternalConceptFlag — server-side re-derivation of externalConcept on incoming
  // ProductSummary, defending against a client tampering with the flag through Jackson
  // deserialization (the field is JsonProperty.READ_ONLY but Jackson can still bind via
  // reflection if Lombok-suppressed setters are bypassed).
  // ------------------------------------------------------------------------------------------

  private static au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration nmpcModel() {
    au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration cfg =
        new au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration();
    cfg.setModelType(au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelType.NMPC);
    cfg.setModuleId(AUTHORING_MODULE);
    return cfg;
  }

  @Test
  void normaliseFlipsExternalFlagBackToTrueForExternalConcept() {
    Node externalOriginal = existingNode("1296676008", SCT_CORE_MODULE);
    // Build with the WRONG authoringModuleId (matches the concept's own module) so the stored
    // externalConcept flag computes to false — simulating a client-supplied payload that's been
    // tampered with, or a clone whose Jackson round-trip dropped the server-derived flag.
    OriginalNode tampered =
        OriginalNode.of(externalOriginal, InactivationReason.ERRONEOUS, false, SCT_CORE_MODULE);
    assertThat(tampered.isExternalConcept()).isFalse();

    Node node = nodeWithNewConceptDetails(tampered);
    au.gov.digitalhealth.lingo.product.ProductSummary summary =
        new au.gov.digitalhealth.lingo.product.ProductSummary();
    summary.getNodes().add(node);

    ProductCreationService.normaliseExternalConceptFlag(summary, nmpcModel());

    assertThat(node.getOriginalNode().isExternalConcept())
        .as("externalConcept must be re-derived to true for SCT International concept")
        .isTrue();
  }

  @Test
  void jacksonDeserialisationDropsClientSuppliedExternalConcept() throws Exception {
    // Direct round-trip test for the @JsonProperty(READ_ONLY) lockdown on externalConcept.
    // A client posting a payload that claims externalConcept=true on an authoring-module concept
    // must NOT result in a deserialized OriginalNode with externalConcept=true; the field is
    // server-derived only and the wire value is ignored on input.
    com.fasterxml.jackson.databind.ObjectMapper mapper =
        new com.fasterxml.jackson.databind.ObjectMapper();
    String json =
        "{\"node\":{\"concept\":{\"conceptId\":\"1234567890\",\"moduleId\":\""
            + AUTHORING_MODULE
            + "\"},\"label\":\"VMP\",\"displayName\":\"Virtual Medicinal Product\","
            + "\"modelLevel\":\"CLINICAL_DRUG\"},"
            + "\"inactivationReason\":null,"
            + "\"referencedByOtherProducts\":false,"
            + "\"externalConcept\":true}"; // client tries to assert external=true

    OriginalNode parsed = mapper.readValue(json, OriginalNode.class);

    assertThat(parsed.isExternalConcept())
        .as(
            "Jackson must ignore the client-supplied externalConcept value; the server is the"
                + " source of truth via OriginalNode.of and normaliseExternalConceptFlag")
        .isFalse();
  }

  @Test
  void normaliseHandlesNodesWithoutOriginalNode() {
    Node nodeWithoutOriginal = new Node(null, vmpLevel());
    NewConceptDetails details = new NewConceptDetails();
    details.setConceptId(-1);
    details.setFullySpecifiedName("New (medicinal product)");
    details.setPreferredTerm("New");
    nodeWithoutOriginal.setNewConceptDetails(details);
    // No originalNode set
    au.gov.digitalhealth.lingo.product.ProductSummary summary =
        new au.gov.digitalhealth.lingo.product.ProductSummary();
    summary.getNodes().add(nodeWithoutOriginal);

    // Should not throw — nodes without an originalNode are simply skipped.
    ProductCreationService.normaliseExternalConceptFlag(summary, nmpcModel());

    assertThat(nodeWithoutOriginal.getOriginalNode()).isNull();
  }

  @Test
  void normaliseAlsoRewritesUnmatchedPreviouslyReferencedNodes() {
    Node externalOriginal = existingNode("1296676008", SCT_CORE_MODULE);
    // See normaliseFlipsExternalFlagBackToTrueForExternalConcept: passing the concept's own
    // module as "authoring" yields a stored flag of false — the tampered state we want to test.
    OriginalNode tampered = OriginalNode.of(externalOriginal, null, false, SCT_CORE_MODULE);
    assertThat(tampered.isExternalConcept()).isFalse();

    au.gov.digitalhealth.lingo.product.ProductSummary summary =
        new au.gov.digitalhealth.lingo.product.ProductSummary();
    summary.getUnmatchedPreviouslyReferencedNodes().add(tampered);

    ProductCreationService.normaliseExternalConceptFlag(summary, nmpcModel());

    // The set was rebuilt, so the contents should be the re-derived version.
    assertThat(summary.getUnmatchedPreviouslyReferencedNodes())
        .singleElement()
        .matches(OriginalNode::isExternalConcept);
  }

  // ------------------------------------------------------------------------------------------
  // validateUpdateOperation — service-layer guard against external + inactivationReason. Also
  // enforced by @AssertTrue on OriginalNode, but the service-layer throw produces a clearer
  // domain message than the generic constraint-violation envelope.
  // ------------------------------------------------------------------------------------------

  private static void invokeValidateUpdateOperation(
      au.gov.digitalhealth.lingo.product.ProductSummary summary) throws Exception {
    Method method =
        ProductCreationService.class.getDeclaredMethod(
            "validateUpdateOperation", au.gov.digitalhealth.lingo.product.ProductSummary.class);
    method.setAccessible(true);
    try {
      method.invoke(null, summary);
    } catch (java.lang.reflect.InvocationTargetException e) {
      // unwrap the underlying exception
      if (e.getCause() instanceof RuntimeException re) {
        throw re;
      }
      throw new RuntimeException(e.getCause());
    }
  }

  @Test
  void validateUpdateOperationRejectsExternalConceptWithInactivationReason() {
    // The illegal state: external concept with a non-null inactivation reason. The @AssertTrue
    // catches this at any @Valid boundary, but the service-layer check is needed when the
    // ProductSummary is built server-side (no JSR-303 entry point) or when a future refactor
    // moves the boundary.
    Node externalOriginal = existingNode("1296676008", SCT_CORE_MODULE);
    OriginalNode badRederived =
        OriginalNode.of(externalOriginal, InactivationReason.ERRONEOUS, false, AUTHORING_MODULE);
    assertThat(badRederived.isExternalConcept()).isTrue();
    assertThat(badRederived.getInactivationReason()).isNotNull();

    Node node = nodeWithNewConceptDetails(badRederived);
    au.gov.digitalhealth.lingo.product.ProductSummary summary =
        new au.gov.digitalhealth.lingo.product.ProductSummary();
    summary.getNodes().add(node);

    assertThatThrownBy(() -> invokeValidateUpdateOperation(summary))
        .isInstanceOf(au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem.class)
        .hasMessageContaining("1296676008")
        .hasMessageContaining("external module");
  }

  @Test
  void validateUpdateOperationAcceptsLegitimateExternalReplaceWithoutRetire() {
    // External concept with null inactivationReason — valid replace-without-retire.
    Node externalOriginal = existingNode("1296676008", SCT_CORE_MODULE);
    OriginalNode legitExternal = OriginalNode.of(externalOriginal, null, false, AUTHORING_MODULE);
    Node node = nodeWithNewConceptDetails(legitExternal);
    au.gov.digitalhealth.lingo.product.ProductSummary summary =
        new au.gov.digitalhealth.lingo.product.ProductSummary();
    summary.getNodes().add(node);

    // Should not throw.
    org.junit.jupiter.api.Assertions.assertDoesNotThrow(
        () -> invokeValidateUpdateOperation(summary));
  }

  @Test
  void validateUpdateOperationAcceptsInternalRetireAndReplace() {
    Node internalOriginal = existingNode("1234567890", AUTHORING_MODULE);
    OriginalNode legitRetire =
        OriginalNode.of(internalOriginal, InactivationReason.ERRONEOUS, false, AUTHORING_MODULE);
    Node node = nodeWithNewConceptDetails(legitRetire);
    au.gov.digitalhealth.lingo.product.ProductSummary summary =
        new au.gov.digitalhealth.lingo.product.ProductSummary();
    summary.getNodes().add(node);

    org.junit.jupiter.api.Assertions.assertDoesNotThrow(
        () -> invokeValidateUpdateOperation(summary));
  }
}
