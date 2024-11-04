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

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import junit.framework.TestCase;
import org.jgrapht.graph.GraphCycleProhibitedException;
import org.junit.jupiter.api.Assertions;

public class NodeDependencyComparatorTest extends TestCase {

  private static Node getNode(int x) {
    Node node1 = new Node(null, "label");
    node1.setNewConceptDetails(new NewConceptDetails());
    node1.getNewConceptDetails().setConceptId(x);
    return node1;
  }

  private static void assertExpectedOrder(
      Set<Node> nodes, NodeDependencyComparator comparator, List<String> expectedOrder) {
    Assertions.assertEquals(
        expectedOrder,
        nodes.stream().sorted(comparator).map(Node::getConceptId).toList(),
        "Nodes should be sorted in dependency order from edges "
            + nodes.stream()
                .flatMap(
                    n ->
                        n.getNewConceptDetails().getAxioms().stream()
                            .flatMap(
                                a ->
                                    a.getRelationships().stream()
                                        .map(
                                            r -> n.getConceptId() + " -> " + r.getDestinationId())))
                .collect(Collectors.joining(",")));
  }

  public void testSimpleDependency() {
    Node node1 = getNode(-1);
    Node node2 = getNode(2);

    createDependency(node2, node1);

    Set<Node> nodes = new HashSet<>();
    nodes.add(node1);
    nodes.add(node2);

    NodeDependencyComparator comparator = new NodeDependencyComparator(nodes);

    assertExpectedOrder(nodes, comparator, List.of(node1.getConceptId(), node2.getConceptId()));
  }

  public void testComplexDependency() {
    Node node2 = getNode(-2);
    Node node3 = getNode(-3);
    Node node4 = getNode(-4);
    Node node5 = getNode(-5);
    Node node6 = getNode(-6);

    // this caused an issue in the past
    // 4 -> 6 -> 2
    // 3 -> 5 -> 2

    createDependency(node4, node6);
    createDependency(node6, node2);
    createDependency(node3, node5);
    createDependency(node5, node2);

    Set<Node> nodes = new HashSet<>();
    nodes.add(node2);
    nodes.add(node3);
    nodes.add(node4);
    nodes.add(node5);
    nodes.add(node6);

    NodeDependencyComparator comparator = new NodeDependencyComparator(nodes);

    assertExpectedOrder(
        nodes,
        comparator,
        List.of(
            node2.getConceptId(),
            node6.getConceptId(),
            node5.getConceptId(),
            node4.getConceptId(),
            node3.getConceptId()));
  }

  public void testComplexDependency2() {
    Node node2 = getNode(-2);
    Node node3 = getNode(-3);
    Node node4 = getNode(-4);
    Node node5 = getNode(-5);
    Node node6 = getNode(-6);

    // this caused an issue in the past
    // 6 -> 5 -> 4 -> 2
    // 6 -> 3 -> 2
    // 5 -> 3 -> 2

    createDependency(node6, node5);
    createDependency(node5, node4);
    createDependency(node4, node2);
    createDependency(node6, node3);
    createDependency(node3, node2);
    createDependency(node5, node3);

    Set<Node> nodes = new HashSet<>();
    nodes.add(node2);
    nodes.add(node3);
    nodes.add(node4);
    nodes.add(node5);
    nodes.add(node6);

    NodeDependencyComparator comparator = new NodeDependencyComparator(nodes);

    assertExpectedOrder(
        nodes,
        comparator,
        List.of(
            node2.getConceptId(),
            node4.getConceptId(),
            node3.getConceptId(),
            node5.getConceptId(),
            node6.getConceptId()));
  }

  public void testCyclicDependency() {
    Node node1 = getNode(-1);
    Node node2 = getNode(-2);

    createDependency(node2, node1);
    createDependency(node1, node2);

    Set<Node> nodes = new HashSet<>();
    nodes.add(node1);
    nodes.add(node2);

    Assertions.assertThrows(
        GraphCycleProhibitedException.class, () -> new NodeDependencyComparator(nodes));
  }

  public void testComplexCyclicDependency() {
    Node node1 = getNode(-1);
    Node node2 = getNode(-2);
    Node node3 = getNode(-3);
    Node node4 = getNode(-4);

    // 1 -> 2 -> 3
    // 4 -> 3 -> 1

    createDependency(node1, node2);
    createDependency(node2, node3);
    createDependency(node4, node3);
    createDependency(node3, node1);

    Set<Node> nodes = new HashSet<>();
    nodes.add(node1);
    nodes.add(node2);
    nodes.add(node3);
    nodes.add(node4);

    Assertions.assertThrows(
        GraphCycleProhibitedException.class, () -> new NodeDependencyComparator(nodes));
  }

  private void createDependency(Node node, Node node1) {
    SnowstormRelationship relationship = new SnowstormRelationship();
    relationship.setDestinationId(node1.getConceptId());
    relationship.setConcrete(false);
    if (node.getNewConceptDetails().getAxioms() == null
        || node.getNewConceptDetails().getAxioms().isEmpty()) {
      node.getNewConceptDetails().setAxioms(new HashSet<>());
      node.getNewConceptDetails().getAxioms().add(new SnowstormAxiom());
    }
    node.getNewConceptDetails().getAxioms().iterator().next().getRelationships().add(relationship);
  }
}
