package com.csiro.snomio.product;

import static com.csiro.snomio.service.ProductSummaryService.CTPP_LABEL;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.csiro.snomio.exception.MoreThanOneSubjectProblem;
import com.csiro.snomio.exception.SingleConceptExpectedProblem;
import com.csiro.snomio.exception.SnomioProblem;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * "N-box" model DTO listing a set of nodes and edges between them where the nodes and edges have
 * labels indicating their type.
 */
@Getter
public class ProductSummary implements Serializable {

  @NotNull final Set<Node> subjects = new HashSet<>();

  @NotNull @NotEmpty final Set<@Valid Node> nodes = new HashSet<>();

  @NotNull @NotEmpty final Set<@Valid Edge> edges = new HashSet<>();

  @JsonProperty(value = "containsNewConcepts", access = JsonProperty.Access.READ_ONLY)
  public boolean isContainsNewConcepts() {
    return nodes.stream().anyMatch(Node::isNewConcept);
  }

  public void addNode(Node node) {
    synchronized (nodes) {
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
  }

  public void addNode(SnowstormConceptMini conceptSummary, String label) {
    synchronized (nodes) {
      Node node = new Node(conceptSummary, label);
      addNode(node);
    }
  }

  public void addEdge(String source, String target, String type) {
    synchronized (edges) {
      edges.add(new Edge(source, target, type));
    }
  }

  public void addSummary(ProductSummary productSummary) {
    synchronized (edges) {
      productSummary.getNodes().forEach(this::addNode);
      edges.addAll(productSummary.getEdges());
    }
  }

  public Node getSingleConceptWithLabel(String label) {
    synchronized (nodes) {
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
        return filteredNodes.iterator().next();
      }
    }
  }

  public Set<String> getConceptIdsWithLabel(String label) {
    synchronized (nodes) {
      return getNodes().stream()
          .filter(n -> n.getLabel().equals(label))
          .map(Node::getConceptId)
          .collect(Collectors.toSet());
    }
  }

  public Set<String> getTargetsOfTypeWithLabel(String source, String nodeLabel, String edgeLabel) {
    synchronized (edges) {
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

  public Set<Node> calculateSubject(boolean singleSubject) {
    synchronized (nodes) {
      Set<Node> subjectNodes =
          getNodes().stream()
              .filter(
                  n ->
                      n.getLabel().equals(CTPP_LABEL)
                          && getEdges().stream()
                              .noneMatch(e -> e.getTarget().equals(n.getConceptId())))
              .collect(Collectors.toSet());

      if (singleSubject && subjectNodes.size() != 1) {
        throw new MoreThanOneSubjectProblem(
            "Product model must have exactly one CTPP node (root) with no incoming edges. Found "
                + subjectNodes.size()
                + " which were "
                + subjectNodes.stream().map(Node::getConceptId).collect(Collectors.joining(", ")));
      }

      return subjectNodes;
    }
  }

  public Node getNode(String id) {
    synchronized (nodes) {
      return nodes.stream().filter(n -> n.getConceptId().equals(id)).findFirst().orElse(null);
    }
  }

  public void updateNodeChangeStatus(List<String> taskChangedIds, List<String> projectChangedIds) {
    synchronized (nodes) {
      nodes.forEach(
          n -> {
            n.setNewInTask(
                taskChangedIds.contains(n.getConceptId())
                    && !projectChangedIds.contains(n.getConceptId()));
            n.setNewInProject(projectChangedIds.contains(n.getConceptId()));
          });
    }
  }

  public void addSubject(Node node) {
    synchronized (subjects) {
      subjects.add(node);
    }
  }

  @JsonIgnore
  public Node getSingleSubject() {
    synchronized (subjects) {
      if (subjects.size() != 1) {
        throw new SnomioProblem(
            "product-summary",
            "No subject set",
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Expected 1 subject but found "
                + subjects.stream().map(Node::getConceptId).collect(Collectors.joining(", ")));
      }
      return subjects.iterator().next();
    }
  }

  @JsonIgnore
  public void setSingleSubject(Node ctppNode) {
    synchronized (subjects) {
      if (subjects.size() == 1 && subjects.contains(ctppNode)) {
        return;
      } else if (!subjects.isEmpty()) {
        throw new SnomioProblem(
            "product-summary",
            "Subject already set",
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Subject already set to "
                + subjects.stream().map(Node::getConceptId).collect(Collectors.joining(", "))
                + " cannot set to "
                + ctppNode.getConceptId());
      }
      subjects.add(ctppNode);
    }
  }
}
