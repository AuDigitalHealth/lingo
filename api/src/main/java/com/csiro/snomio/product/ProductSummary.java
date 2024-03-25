package com.csiro.snomio.product;

import static com.csiro.snomio.service.ProductSummaryService.CTPP_LABEL;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.csiro.snomio.exception.MoreThanOneSubjectProblem;
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

  @NotNull Node subject;

  @NotNull @NotEmpty Set<@Valid Node> nodes = new HashSet<>();
  @NotNull @NotEmpty Set<@Valid Edge> edges = new HashSet<>();

  @JsonProperty(value = "containsNewConcepts", access = JsonProperty.Access.READ_ONLY)
  public boolean isContainsNewConcepts() {
    return nodes.stream().anyMatch(Node::isNewConcept);
  }

  public void addNode(Node node) {
    for (Node n : nodes) {
      if (n.getConceptId().equals(node.getConceptId()) && !n.getLabel().equals(node.getLabel())) {
        throw new SingleConceptExpectedProblem(
            "Node with id "
                + node.getConceptId()
                + " and label "
                + node.getLabel()
                + " already exists in product model with label "
                + n.getLabel(),
            1);
      }
    }

    nodes.add(node);
  }

  public Node addNode(SnowstormConceptMini conceptSummary, String label) {
    Node node = new Node(conceptSummary, label);
    addNode(node);
    return node;
  }

  public void addEdge(String source, String target, String type) {
    edges.add(new Edge(source, target, type));
  }

  public void addSummary(ProductSummary productSummary) {
    productSummary.getNodes().forEach(this::addNode);
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
              + String.join(", ", target),
          target.size());
    } else {
      return target.iterator().next();
    }
  }

  public Node calculateSubject() {
    Set<Node> subjectNodes =
        getNodes().stream()
            .filter(
                n ->
                    n.getLabel().equals(CTPP_LABEL)
                        && getEdges().stream()
                            .noneMatch(e -> e.getTarget().equals(n.getConceptId())))
            .collect(Collectors.toSet());

    if (subjectNodes.size() != 1) {
      throw new MoreThanOneSubjectProblem(
          "Product model must have exactly one CTPP node (root) with no incoming edges. Found "
              + subjectNodes.size()
              + " which were "
              + subjectNodes.stream().map(Node::getConceptId).collect(Collectors.joining(", ")));
    }

    return subjectNodes.iterator().next();
  }

  public Node getNode(String id) {
    return nodes.stream().filter(n -> n.getConceptId().equals(id)).findFirst().orElse(null);
  }
}
