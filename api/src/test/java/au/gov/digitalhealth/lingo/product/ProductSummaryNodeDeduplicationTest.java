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

import static au.gov.digitalhealth.lingo.product.ProductSummary.createNodeDeduplicationComparator;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.product.details.properties.ReferenceSet;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

public class ProductSummaryNodeDeduplicationTest {

  @Test
  public void
      testCreateNodeDeduplicationComparator_ShouldEvaluateNodesWithDifferentLanguageCodesAsEqual() {
    // Create first node with "en" language code
    SnowstormConceptMini concept1 = new SnowstormConceptMini();
    concept1.setConceptId("706461000168100");
    concept1.setActive(null);
    concept1.setDefinitionStatus("PRIMITIVE");
    concept1.setModuleId(null);
    concept1.setEffectiveTime(null);

    SnowstormTermLangPojo fsn1 = new SnowstormTermLangPojo();
    fsn1.setTerm("Morphine (Juno) (product name)");
    fsn1.setLang("en");
    concept1.setFsn(fsn1);

    SnowstormTermLangPojo pt1 = new SnowstormTermLangPojo();
    pt1.setTerm("Morphine (Juno)");
    pt1.setLang("en");
    concept1.setPt(pt1);

    Node node1 =
        Node.builder()
            .concept(concept1)
            .conceptOptions(new ArrayList<>())
            .label("TP")
            .displayName("Brand Name")
            .newConceptDetails(null)
            .newInTask(false)
            .newInProject(false)
            .nonDefiningProperties(
                new HashSet<>() {
                  {
                    add(new ReferenceSet());
                  }
                })
            .originalNode(null)
            .modelLevel(ModelLevelType.PRODUCT_NAME)
            .relationships(new ArrayList<>())
            .axioms(new ArrayList<>())
            .historicalAssociations(new ArrayList<>())
            .build();

    // Create second node with extended language code
    SnowstormConceptMini concept2 = new SnowstormConceptMini();
    concept2.setConceptId("706461000168100");
    concept2.setActive(null);
    concept1.setDefinitionStatus("PRIMITIVE");
    concept2.setModuleId(null);
    concept2.setEffectiveTime(null);

    SnowstormTermLangPojo fsn2 = new SnowstormTermLangPojo();
    fsn2.setTerm("Morphine (Juno) (product name)");
    fsn2.setLang("en");
    concept2.setFsn(fsn2);

    SnowstormTermLangPojo pt2 = new SnowstormTermLangPojo();
    pt2.setTerm("Morphine (Juno)");
    pt2.setLang("en-x-sctlang-32570271-00003610-6");
    concept2.setPt(pt2);

    Node node2 =
        Node.builder()
            .concept(concept2)
            .conceptOptions(new ArrayList<>())
            .label("TP")
            .displayName("Brand Name")
            .newConceptDetails(null)
            .newInTask(false)
            .newInProject(false)
            .nonDefiningProperties(
                new HashSet<>() {
                  {
                    add(new ReferenceSet());
                  }
                })
            .originalNode(null)
            .modelLevel(ModelLevelType.PRODUCT_NAME)
            .relationships(new ArrayList<>())
            .axioms(new ArrayList<>())
            .historicalAssociations(new ArrayList<>())
            .build();

    // Get the comparator using reflection to access the private method
    Comparator<Node> comparator = createNodeDeduplicationComparator();

    // Test that the comparator evaluates these nodes as equal (returns 0)
    int comparison = comparator.compare(node1, node2);
    assertEquals(
        0,
        comparison,
        "Nodes with the same concept ID but different preferred term language codes should be considered equal by the deduplication comparator");
  }

  @Test
  public void testCreateNodeDeduplicationComparator_ShouldEvaluateIdenticalNodesAsEqual() {
    // Create two identical nodes
    SnowstormConceptMini concept = new SnowstormConceptMini();
    concept.setConceptId("706461000168100");
    concept.setActive(null);
    concept.setDefinitionStatus("PRIMITIVE");
    concept.setModuleId(null);
    concept.setEffectiveTime(null);

    SnowstormTermLangPojo fsn = new SnowstormTermLangPojo();
    fsn.setTerm("Morphine (Juno) (product name)");
    fsn.setLang("en");
    concept.setFsn(fsn);

    SnowstormTermLangPojo pt = new SnowstormTermLangPojo();
    pt.setTerm("Morphine (Juno)");
    pt.setLang("en");
    concept.setPt(pt);

    Node node1 = createTestNode(concept, "TP", "Brand Name", ModelLevelType.PRODUCT_NAME);
    Node node2 = createTestNode(concept, "TP", "Brand Name", ModelLevelType.PRODUCT_NAME);

    Comparator<Node> comparator = createNodeDeduplicationComparator();

    int comparison = comparator.compare(node1, node2);
    assertEquals(0, comparison, "Identical nodes should be considered equal");
  }

  @Test
  public void testCreateNodeDeduplicationComparator_ShouldOrderNodesByConceptId() {
    // Create nodes with different concept IDs
    SnowstormConceptMini concept1 = createSnowstormConcept("123456000", "First concept", "First");
    SnowstormConceptMini concept2 = createSnowstormConcept("789012000", "Second concept", "Second");

    Node node1 = createTestNode(concept1, "TP", "Brand Name", ModelLevelType.PRODUCT_NAME);
    Node node2 = createTestNode(concept2, "TP", "Brand Name", ModelLevelType.PRODUCT_NAME);

    Comparator<Node> comparator = createNodeDeduplicationComparator();

    int comparison = comparator.compare(node1, node2);
    assertTrue(comparison < 0, "Node with smaller concept ID should come first");

    int reverseComparison = comparator.compare(node2, node1);
    assertTrue(reverseComparison > 0, "Node with larger concept ID should come after");
  }

  @Test
  public void testCreateNodeDeduplicationComparator_ShouldOrderNodesByLabel() {
    // Create nodes with same concept ID but different labels
    SnowstormConceptMini concept = createSnowstormConcept("123456000", "Test concept", "Test");

    Node node1 =
        createTestNode(concept, "CTPP", "Container package", ModelLevelType.PACKAGED_CLINICAL_DRUG);
    Node node2 = createTestNode(concept, "TP", "Brand Name", ModelLevelType.PRODUCT_NAME);

    Comparator<Node> comparator = createNodeDeduplicationComparator();

    int comparison = comparator.compare(node1, node2);
    assertTrue(comparison < 0, "Node with label 'CTPP' should come before 'TP'");
  }

  @Test
  public void testCreateNodeDeduplicationComparator_ShouldOrderNodesByModelLevel() {
    // Create nodes with same concept ID and label but different model levels
    SnowstormConceptMini concept = createSnowstormConcept("123456000", "Test concept", "Test");

    Node node1 =
        createTestNode(
            concept, "TP", "Brand Name", ModelLevelType.REAL_CONTAINERIZED_PACKAGED_CLINICAL_DRUG);
    Node node2 = createTestNode(concept, "TP", "Brand Name", ModelLevelType.PRODUCT_NAME);

    Comparator<Node> comparator = createNodeDeduplicationComparator();

    int comparison = comparator.compare(node1, node2);
    // The comparison result depends on enum ordinal values
    assertNotEquals(0, comparison, "Nodes with different model levels should not be equal");
  }

  @Test
  public void testCreateNodeDeduplicationComparator_ShouldOrderNodesByNewInTaskFlag() {
    // Create nodes where one is new in task and the other is not
    SnowstormConceptMini concept = createSnowstormConcept("123456000", "Test concept", "Test");

    Node node1 =
        createTestNodeWithFlags(
            concept, "TP", "Brand Name", ModelLevelType.PRODUCT_NAME, false, false);
    Node node2 =
        createTestNodeWithFlags(
            concept, "TP", "Brand Name", ModelLevelType.PRODUCT_NAME, true, false);

    Comparator<Node> comparator = createNodeDeduplicationComparator();

    int comparison = comparator.compare(node1, node2);
    assertTrue(comparison < 0, "Node with newInTask=false should come before newInTask=true");
  }

  @Test
  public void testCreateNodeDeduplicationComparator_ShouldOrderNodesByNewInProjectFlag() {
    // Create nodes where one is new in project and the other is not
    SnowstormConceptMini concept = createSnowstormConcept("123456000", "Test concept", "Test");

    Node node1 =
        createTestNodeWithFlags(
            concept, "TP", "Brand Name", ModelLevelType.PRODUCT_NAME, false, false);
    Node node2 =
        createTestNodeWithFlags(
            concept, "TP", "Brand Name", ModelLevelType.PRODUCT_NAME, false, true);

    Comparator<Node> comparator = createNodeDeduplicationComparator();

    int comparison = comparator.compare(node1, node2);
    assertTrue(comparison < 0, "Node with newInProject=false should come before newInProject=true");
  }

  @Test
  public void testCreateNodeDeduplicationComparator_ShouldOrderNodesWithNonDefiningProperties() {
    // Create nodes with different non-defining properties
    SnowstormConceptMini concept = createSnowstormConcept("123456000", "Test concept", "Test");

    Node node1 = createTestNode(concept, "TP", "Brand Name", ModelLevelType.PRODUCT_NAME);

    Node node2 = createTestNode(concept, "TP", "Brand Name", ModelLevelType.PRODUCT_NAME);
    ReferenceSet additionalRefSet = new ReferenceSet();
    node2.getNonDefiningProperties().add(additionalRefSet);

    Comparator<Node> comparator = createNodeDeduplicationComparator();

    int comparison = comparator.compare(node1, node2);
    assertNotEquals(
        0, comparison, "Nodes with different non-defining properties should not be equal");
  }

  /**
   * Regression test for a customer-reported bug (CUST1705924): authoring a new multi-component (2+
   * active ingredient) NMPC product created two identical ATM concepts instead of one.
   *
   * <p>Two "new concept" nodes are built for the same product, but with the two active ingredient
   * relationships assigned to swapped group numbers (ingredient A group 1 / B group 2 on one node,
   * B group 1 / A group 2 on the other) — exactly what can happen when the same set of ingredients
   * is independently built twice during a single product calculation. They should still be
   * recognised as the same concept and merged down to one node.
   */
  @Test
  public void testDeduplicateNewNodes_ShouldMergeSameConceptWithSwappedIngredientGroupNumbers() {
    SnowstormRelationship isA = relationship("116680003", "763158003", 0);
    SnowstormRelationship ingredientA = relationship("762949000", "387584000", 1);
    SnowstormRelationship ingredientB = relationship("762949000", "387047004", 2);
    SnowstormRelationship ingredientASwapped = relationship("762949000", "387584000", 2);
    SnowstormRelationship ingredientBSwapped = relationship("762949000", "387047004", 1);

    Node node1 = newConceptNode(-1, isA, ingredientA, ingredientB);
    Node node2 = newConceptNode(-2, isA, ingredientASwapped, ingredientBSwapped);

    ProductSummary summary = new ProductSummary();
    summary.addNode(node1);
    summary.addNode(node2);

    summary.deduplicateNewNodes(new ModelConfiguration());

    assertEquals(
        1,
        summary.getNodes().size(),
        "The two new-concept nodes describe the same product with the same two ingredients, just "
            + "numbered in a different order, so they should be merged into a single node");
  }

  private static SnowstormRelationship relationship(
      String typeId, String destinationId, int group) {
    SnowstormRelationship relationship = new SnowstormRelationship();
    relationship.setTypeId(typeId);
    relationship.setDestinationId(destinationId);
    relationship.setGroupId(group);
    return relationship;
  }

  /** Helper to build a "new concept" Node (i.e. isNewConcept() == true) with the given axiom. */
  private static Node newConceptNode(int conceptId, SnowstormRelationship... relationships) {
    SnowstormAxiom axiom = new SnowstormAxiom();
    axiom.setDefinitionStatus("PRIMITIVE");
    axiom.setRelationships(new HashSet<>(Set.of(relationships)));

    NewConceptDetails newConceptDetails = new NewConceptDetails(conceptId);
    newConceptDetails.setFullySpecifiedName("Test product (clinical drug)");
    newConceptDetails.setPreferredTerm("Test product");
    newConceptDetails.setGeneratedFullySpecifiedName("Test product (clinical drug)");
    newConceptDetails.setGeneratedPreferredTerm("Test product");
    newConceptDetails.setSemanticTag("clinical drug");
    newConceptDetails.setAxioms(new HashSet<>(Set.of(axiom)));

    return Node.builder()
        .newConceptDetails(newConceptDetails)
        .conceptOptions(new ArrayList<>())
        .label("MPUU")
        .displayName("Generic Product")
        .newInTask(true)
        .newInProject(true)
        .nonDefiningProperties(new HashSet<>())
        .modelLevel(ModelLevelType.CLINICAL_DRUG)
        .relationships(new ArrayList<>())
        .axioms(new ArrayList<>())
        .historicalAssociations(new ArrayList<>())
        .build();
  }

  /** Helper method to create a SnowstormConceptMini with specified values */
  private SnowstormConceptMini createSnowstormConcept(
      String conceptId, String fsnTerm, String ptTerm) {
    SnowstormConceptMini concept = new SnowstormConceptMini();
    concept.setConceptId(conceptId);
    concept.setActive(null);
    concept.setDefinitionStatus("PRIMITIVE");
    concept.setModuleId(null);
    concept.setEffectiveTime(null);

    SnowstormTermLangPojo fsn = new SnowstormTermLangPojo();
    fsn.setTerm(fsnTerm);
    fsn.setLang("en");
    concept.setFsn(fsn);

    SnowstormTermLangPojo pt = new SnowstormTermLangPojo();
    pt.setTerm(ptTerm);
    pt.setLang("en");
    concept.setPt(pt);

    return concept;
  }

  /** Helper method to create a test node with specified parameters */
  private Node createTestNode(
      SnowstormConceptMini concept, String label, String displayName, ModelLevelType modelLevel) {
    return createTestNodeWithFlags(concept, label, displayName, modelLevel, false, false);
  }

  /** Helper method to create a test node with specified flags */
  private Node createTestNodeWithFlags(
      SnowstormConceptMini concept,
      String label,
      String displayName,
      ModelLevelType modelLevel,
      boolean newInTask,
      boolean newInProject) {
    return Node.builder()
        .concept(concept)
        .conceptOptions(new ArrayList<>())
        .label(label)
        .displayName(displayName)
        .newConceptDetails(null)
        .newInTask(newInTask)
        .newInProject(newInProject)
        .originalNode(null)
        .modelLevel(modelLevel)
        .relationships(new ArrayList<>())
        .axioms(new ArrayList<>())
        .historicalAssociations(new ArrayList<>())
        .build();
  }
}
