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

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.exception.MoreThanOneSubjectProblem;
import au.gov.digitalhealth.lingo.exception.SingleConceptExpectedProblem;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.common.collect.Sets;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * "N-box" model DTO listing a set of nodes and edges between them where the nodes and edges have
 * labels indicating their type.
 */
@Getter
@EqualsAndHashCode
public class ProductSummary implements Serializable {

  @NotNull final Set<Node> subjects = new HashSet<>();

  @NotNull @NotEmpty final Set<@Valid Node> nodes = new HashSet<>();

  @NotNull @NotEmpty final Set<@Valid Edge> edges = new HashSet<>();

  @NotNull final Set<@Valid OriginalNode> unmatchedPreviouslyReferencedNodes = new HashSet<>();

  @JsonProperty(value = "containsNewConcepts", access = JsonProperty.Access.READ_ONLY)
  public boolean isContainsNewConcepts() {
    return nodes.stream().anyMatch(Node::isNewConcept);
  }

  @JsonProperty(value = "containsEditedConcepts", access = JsonProperty.Access.READ_ONLY)
  public boolean isContainsEditedConcepts() {
    return nodes.stream().anyMatch(Node::isConceptEdit);
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

  public Node addNode(SnowstormConceptMini conceptSummary, ModelLevel modelLevel) {
    synchronized (nodes) {
      Node node = new Node(conceptSummary, modelLevel);
      node.setModelLevel(modelLevel.getModelLevelType());
      node.setDisplayName(modelLevel.getName());
      addNode(node);
      return node;
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

  public Set<Node> calculateSubject(boolean singleSubject, ModelConfiguration modelConfiguration) {
    synchronized (nodes) {
      Set<Node> subjectNodes =
          getNodes().stream()
              .filter(
                  n ->
                      modelConfiguration
                              .getLeafPackageModelLevel()
                              .getDisplayLabel()
                              .equals(n.getLabel())
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
            if (!n.isNewInTask()) {
              n.setNewInTask(
                  taskChangedIds.contains(n.getConceptId())
                      && !projectChangedIds.contains(n.getConceptId()));
            }
            if (!n.isNewInProject()) {
              n.setNewInProject(projectChangedIds.contains(n.getConceptId()));
            }
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
        throw new LingoProblem(
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
        throw new LingoProblem(
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

  public Node getSingleConceptOfType(ModelLevelType type) {
    synchronized (nodes) {
      Set<Node> filteredNodes =
          getNodes().stream()
              .filter(n -> n.getModelLevel().equals(type))
              .collect(Collectors.toSet());
      if (filteredNodes.size() != 1) {
        throw new SingleConceptExpectedProblem(
            "Expected 1 "
                + type
                + " but found "
                + filteredNodes.stream().map(Node::getIdAndFsnTerm).collect(Collectors.joining()),
            filteredNodes.size());
      } else {
        return filteredNodes.iterator().next();
      }
    }
  }

  private static Predicate<SnowstormRelationship> isDuplicateReference(Node duplicate) {
    return relationship ->
        (relationship.getDestinationId() != null
                && relationship.getDestinationId().equals(duplicate.getConceptId()))
            || (relationship.getSourceId() != null
                && relationship.getSourceId().equals(duplicate.getConceptId()));
  }

  @JsonIgnore
  public void deduplicateNewNodes() {
    synchronized (nodes) {
      Map<Node, Set<Node>> deduplicatedNodes = new HashMap<>();

      nodes.stream()
          .filter(Node::isNewConcept)
          .forEach(
              node -> {
                Node key =
                    deduplicatedNodes.keySet().stream()
                        .filter(
                            n ->
                                n.isNewConcept()
                                    && n.getNewConceptDetails()
                                        .getAxioms()
                                        .equals(node.getNewConceptDetails().getAxioms()))
                        .findFirst()
                        .orElse(null);
                if (key != null) {
                  deduplicatedNodes.get(key).add(node);
                  key.getNonDefiningProperties().addAll(node.getNonDefiningProperties());
                  key.getNewConceptDetails()
                      .getNonDefiningProperties()
                      .addAll(node.getNewConceptDetails().getNonDefiningProperties());
                  key.getNewConceptDetails()
                      .getReferenceSetMembers()
                      .addAll(node.getNewConceptDetails().getReferenceSetMembers());
                } else {
                  deduplicatedNodes.put(node, new HashSet<>());
                }
              });

      deduplicatedNodes.forEach(
          (key, duplicates) -> {
            duplicates.forEach(
                duplicate -> {
                  nodes.remove(duplicate);
                  replaceEdges(duplicate, key);
                  updateRelationships(duplicate, key);
                });
            if (!Sets.intersection(duplicates, subjects).isEmpty()) {
              subjects.removeAll(duplicates);
              subjects.add(key);
            }
          });
    }
  }

  private void updateRelationships(Node duplicate, Node key) {
    nodes.forEach(
        node -> {
          if (node.getNewConceptDetails() != null) {
            node.getNewConceptDetails()
                .getAxioms()
                .forEach(
                    axiom -> {
                      Set<SnowstormRelationship> relationshipsToReplace =
                          axiom.getRelationships().stream()
                              .filter(isDuplicateReference(duplicate))
                              .collect(Collectors.toSet());
                      axiom.getRelationships().removeAll(relationshipsToReplace);
                      relationshipsToReplace.forEach(
                          relationship -> {
                            if (relationship.getDestinationId() != null
                                && relationship
                                    .getDestinationId()
                                    .equals(duplicate.getConceptId())) {
                              relationship.setDestinationId(key.getConceptId());
                            }
                            if (relationship.getSourceId() != null
                                && relationship.getSourceId().equals(duplicate.getConceptId())) {
                              relationship.setSourceId(key.getConceptId());
                            }
                            axiom.getRelationships().add(relationship);
                          });
                    });
          }
        });
  }

  private void replaceEdges(Node duplicate, Node key) {
    Set<Edge> edgestoRemove =
        edges.stream()
            .filter(
                e ->
                    e.getSource().equals(duplicate.getConceptId())
                        || e.getTarget().equals(duplicate.getConceptId()))
            .collect(Collectors.toSet());
    edges.removeAll(edgestoRemove);
    edgestoRemove.forEach(
        edge -> {
          if (edge.getSource().equals(duplicate.getConceptId())) {
            edge.setSource(key.getConceptId());
          }
          if (edge.getTarget().equals(duplicate.getConceptId())) {
            edge.setTarget(key.getConceptId());
          }
          edges.add(edge);
        });
  }
}
