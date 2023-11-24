package com.csiro.snomio.models.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.csiro.snomio.exception.SingleConceptExpectedProblem;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.Data;

/**
 * "N-box" model DTO listing a set of nodes and edges between them where the nodes and edges have
 * labels indicating their type.
 */
@Data
public class ProductSummary {

  @NotNull SnowstormConceptMini subject;

  @NotNull @NotEmpty Set<@Valid Node> nodes = new HashSet<>();
  @NotNull @NotEmpty Set<@Valid Edge> edges = new HashSet<>();

  @JsonProperty(value = "containsNewConcepts", access = JsonProperty.Access.READ_ONLY)
  public boolean isContainsNewConcepts() {
    return nodes.stream().anyMatch(Node::isNewConcept);
  }

  public void addNode(Node node) {
    nodes.add(node);
  }

  public void addNode(SnowstormConceptMini conceptSummary, String label) {
    nodes.add(new Node(conceptSummary, label));
  }

  public void addEdge(String source, String target, String type) {
    edges.add(new Edge(source, target, type));
  }

  public void addSummary(ProductSummary productSummary) {
    nodes.addAll(productSummary.getNodes());
    edges.addAll(productSummary.getEdges());
  }

  public String getSingleConceptWithLabel(String label) {
    Set<Node> filteredNodes =
        getNodes().stream().filter(n -> n.getLabel().equals(label)).collect(Collectors.toSet());
    if (filteredNodes.size() != 1) {
      throw new SingleConceptExpectedProblem(
          "Expected 1 "
              + label
              + " but found "
              + filteredNodes.stream().map(Node::getIdAndFsnTerm).collect(Collectors.joining()),
          filteredNodes.size());
    } else {
      return filteredNodes.iterator().next().getConceptId();
    }
  }

  public Set<String> getConceptIdsWithLabel(String label) {
    return getNodes().stream()
        .filter(n -> n.getLabel().equals(label))
        .map(Node::getConceptId)
        .collect(Collectors.toSet());
  }

  public Set<String> getTargetsOfTypeWithLabel(String source, String nodeLabel, String edgeLabel) {
    Set<String> potentialTargets = getConceptIdsWithLabel(nodeLabel);
    return getEdges().stream()
        .filter(
            e ->
                e.getSource().equals(source)
                    && e.getLabel().equals(edgeLabel)
                    && potentialTargets.contains(e.getTarget()))
        .map(Edge::getTarget)
        .collect(Collectors.toSet());
  }

  public String getSingleTargetOfTypeWithLabel(String source, String nodeLabel, String edgeLabel) {
    Set<String> target = getTargetsOfTypeWithLabel(source, nodeLabel, edgeLabel);
    if (target.size() != 1) {
      throw new SingleConceptExpectedProblem(
          "Expected 1 target of type "
              + nodeLabel
              + " from edge type "
              + edgeLabel
              + " from "
              + source
              + " but found "
              + target.stream().collect(Collectors.joining(", ")),
          target.size());
    } else {
      return target.iterator().next();
    }
  }

  public boolean containsNodeWithId(String id) {
    return nodes.stream().anyMatch(n -> n.getConceptId().equals(id));
  }
}
