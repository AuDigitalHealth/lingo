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
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.configuration.model.BasePropertyDefinition;
import au.gov.digitalhealth.lingo.configuration.model.BasePropertyWithValueDefinition;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.exception.MismatchingPropertiesProblem;
import au.gov.digitalhealth.lingo.exception.MoreThanOneSubjectProblem;
import au.gov.digitalhealth.lingo.exception.SingleConceptExpectedProblem;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningBase;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.common.collect.Sets;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.extern.java.Log;
import org.springframework.http.HttpStatus;
import wiremock.com.google.common.collect.Streams;

/**
 * "N-box" model DTO listing a set of nodes and edges between them where the nodes and edges have
 * labels indicating their type.
 */
@Getter
@EqualsAndHashCode
@Log
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
      node.getNonDefiningProperties().add(modelLevel.createMarkerRefset());
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

  private static Comparator<Node> createNodeDeduplicationComparator() {
    return Comparator.comparing(Node::getConceptId)
        .thenComparing(Node::getLabel)
        .thenComparing(Node::getDisplayName)
        .thenComparing(Node::isNewInTask)
        .thenComparing(Node::isNewInProject)
        .thenComparing(Node::getModelLevel)
        .thenComparing(
            node -> node.getConcept() != null ? node.getConcept().getConceptId() : null,
            Comparator.nullsLast(String::compareTo))
        .thenComparing(node -> compareAxioms(node.getAxioms()))
        .thenComparing(node -> compareRelationships(node.getRelationships()))
        .thenComparing(node -> compareHistoricalAssociations(node.getHistoricalAssociations()))
        .thenComparing(node -> compareNonDefiningProperties(node.getNonDefiningProperties()))
        .thenComparing(node -> compareConceptOptions(node.getConceptOptions()))
        .thenComparing(node -> compareNewConceptDetails(node.getNewConceptDetails()))
        .thenComparing(node -> compareOriginalNode(node.getOriginalNode()));
  }

  private static String compareAxioms(Collection<SnowstormAxiom> axioms) {
    if (axioms == null) return "";
    return axioms.stream()
        .sorted(
            Comparator.comparing(SnowstormAxiom::getDefinitionStatus)
                .thenComparing(
                    axiom -> compareAxiomRelationshipsAsGroups(axiom.getRelationships())))
        .map(
            axiom ->
                axiom.getDefinitionStatus()
                    + ":"
                    + compareAxiomRelationshipsAsGroups(axiom.getRelationships()))
        .collect(Collectors.joining(";"));
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

  private static String compareAxiomRelationshipsAsGroups(
      Set<SnowstormRelationship> relationships) {
    if (relationships == null) return "";

    // Use the same approach as SnowstormDtoUtil.toGroupKeys
    Set<Set<String>> groupKeys =
        relationships.stream()
            .collect(Collectors.groupingBy(r -> r.getGroupId() == null ? 0 : r.getGroupId()))
            .values()
            .stream()
            .map(
                group ->
                    group.stream()
                        .map(ProductSummary::toStringKeyForComparison)
                        .collect(Collectors.toSet()))
            .collect(Collectors.toSet());

    // Convert the set of sets to a sorted, deterministic string representation
    return groupKeys.stream()
        .map(group -> group.stream().sorted().collect(Collectors.joining(",")))
        .sorted()
        .collect(Collectors.joining(";"));
  }

  private static String compareRelationships(Collection<SnowstormRelationship> relationships) {
    if (relationships == null) return "";
    return relationships.stream()
        .sorted(
            Comparator.comparing(
                    SnowstormRelationship::getTypeId, Comparator.nullsLast(String::compareTo))
                .thenComparing(r -> r.getDestinationId(), Comparator.nullsLast(String::compareTo))
                .thenComparing(
                    r -> r.getConcreteValue() != null ? r.getConcreteValue().getValue() : null,
                    Comparator.nullsLast(String::compareTo))
                .thenComparing(r -> r.getGroupId(), Comparator.nullsLast(Integer::compareTo)))
        .map(ProductSummary::toStringKeyForComparison)
        .collect(Collectors.joining(","));
  }

  private static String compareHistoricalAssociations(
      Collection<SnowstormReferenceSetMember> associations) {
    if (associations == null) return "";
    return associations.stream()
        .sorted(
            Comparator.comparing(
                    SnowstormReferenceSetMember::getRefsetId,
                    Comparator.nullsLast(String::compareTo))
                .thenComparing(
                    r -> r.getReferencedComponentId(), Comparator.nullsLast(String::compareTo))
                .thenComparing(r -> r.getActive(), Comparator.nullsLast(Boolean::compareTo))
                .thenComparing(r -> compareAdditionalFields(r.getAdditionalFields())))
        .map(
            r ->
                r.getRefsetId()
                    + ":"
                    + r.getReferencedComponentId()
                    + ":"
                    + r.getActive()
                    + ":"
                    + compareAdditionalFields(r.getAdditionalFields()))
        .collect(Collectors.joining(","));
  }

  private static String compareAdditionalFields(Map<String, String> additionalFields) {
    if (additionalFields == null) return "";
    return additionalFields.entrySet().stream()
        .sorted(Map.Entry.comparingByKey())
        .map(entry -> entry.getKey() + "=" + entry.getValue())
        .collect(Collectors.joining(";"));
  }

  private static String compareNonDefiningProperties(Set<NonDefiningBase> properties) {
    if (properties == null) return "";
    return properties.stream()
        .sorted(
            Comparator.comparing(
                    NonDefiningBase::getIdentifierScheme, Comparator.nullsLast(String::compareTo))
                .thenComparing(NonDefiningBase::getType, Comparator.nullsLast(Enum::compareTo))
                .thenComparing(
                    p -> getValueForComparison(p), Comparator.nullsLast(String::compareTo))
                .thenComparing(p -> p.getTitle(), Comparator.nullsLast(String::compareTo))
                .thenComparing(p -> p.getDescription(), Comparator.nullsLast(String::compareTo)))
        .map(
            p ->
                p.getIdentifierScheme()
                    + ":"
                    + p.getType()
                    + ":"
                    + getValueForComparison(p)
                    + ":"
                    + p.getTitle()
                    + ":"
                    + p.getDescription())
        .collect(Collectors.joining(","));
  }

  private static String getValueForComparison(NonDefiningBase property) {
    if (property instanceof NonDefiningProperty ndp) {
      if (ndp.getValue() != null) {
        return ndp.getValue();
      } else if (ndp.getValueObject() != null) {
        return ndp.getValueObject().getConceptId();
      }
    } else if (property instanceof ExternalIdentifier ei) {
      if (ei.getValue() != null) {
        return ei.getValue();
      } else if (ei.getValueObject() != null) {
        return ei.getValueObject().getConceptId();
      }
    }
    // For ReferenceSet or other types, return empty string since they don't have values
    return "";
  }

  private static String compareConceptOptions(Collection<SnowstormConceptMini> options) {
    if (options == null) return "";
    return options.stream()
        .sorted(
            Comparator.comparing(
                concept -> concept.getConceptId(), Comparator.nullsLast(String::compareTo)))
        .map(SnowstormConceptMini::getConceptId)
        .collect(Collectors.joining(","));
  }

  private static String compareNewConceptDetails(NewConceptDetails details) {
    if (details == null) return "";
    StringBuilder sb = new StringBuilder();
    sb.append(details.getFullySpecifiedName());
    sb.append(":");
    sb.append(details.getPreferredTerm());
    sb.append(":");
    if (details.getAxioms() != null) {
      // Use the same group-based axiom comparison approach
      sb.append(
          details.getAxioms().stream()
              .sorted(Comparator.comparing(SnowstormAxiom::getDefinitionStatus))
              .map(
                  axiom ->
                      axiom.getDefinitionStatus()
                          + ":"
                          + compareAxiomRelationshipsAsGroups(axiom.getRelationships()))
              .collect(Collectors.joining(";")));
    }
    return sb.toString();
  }

  private static String toStringKeyForComparison(SnowstormRelationship relationship) {
    return relationship.getTypeId()
        + "|"
        + (relationship.getConcreteValue() != null
            ? relationship.getConcreteValue().getValue()
            : relationship.getDestinationId())
        + "|"
        + relationship.getCharacteristicTypeId()
        + "|"
        + relationship.getModifierId();
  }

  private static String compareOriginalNode(OriginalNode originalNode) {
    if (originalNode == null) return "";
    StringBuilder sb = new StringBuilder();
    if (originalNode.getNode() != null) {
      sb.append(originalNode.getNode().getConceptId());
    }
    sb.append(":");
    sb.append(originalNode.isReferencedByOtherProducts());
    sb.append(":");
    if (originalNode.getInactivationReason() != null) {
      sb.append(originalNode.getInactivationReason().getValue());
    }
    return sb.toString();
  }

  /**
   * Nodes are compared using equals, but their real primary key is the conceptId. If the conceptIds
   * of Nodes match, but the Nodes are not equal there is a problem. If that mismatch is caused by a
   * mismatch in the non-defining properties, this results in a MismatchedPropertiesProblem which
   * reflects a bad request (400) and creates a message indicating the mismatching properties
   * between the nodes. However if other properties are responsible for the difference something
   * else has gone wrong and this is represented as an unexpected server error (500).
   */
  private void checkNodesForMismatchedProperties(ModelConfiguration modelConfiguration) {
    Map<String, List<Node>> byConceptId =
        nodes.stream().collect(Collectors.groupingBy(Node::getConceptId));

    Map<String, Set<Node>> nonDefiningMismatches = new HashMap<>();

    for (Map.Entry<String, List<Node>> entry : byConceptId.entrySet()) {
      List<Node> group = entry.getValue();
      if (group.size() <= 1) {
        continue;
      }

      // If all nodes are exactly equal, should have been already merged because the source is a
      // set.
      Node first = group.get(0);

      // Determine if the only differences are in non-defining properties.
      Node base = first.cloneNode();
      base.setNonDefiningProperties(new HashSet<>());

      boolean onlyNonDefiningDiffs = true;
      int mismatchingPropertyIndex = 0;
      for (int i = 1; i < group.size(); i++) {
        Node other = group.get(i).cloneNode();
        other.setNonDefiningProperties(new HashSet<>());
        if (!base.equals(other)) {
          onlyNonDefiningDiffs = false;
          mismatchingPropertyIndex = i;
          break;
        }
      }

      if (onlyNonDefiningDiffs) {
        nonDefiningMismatches.put(entry.getKey(), new HashSet<>(group));
      } else {
        // Differences beyond non-defining properties indicate an unexpected server error.
        throw new LingoProblem(
            "product-summary",
            "Mismatched nodes for conceptId " + entry.getKey(),
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Nodes with the same conceptId differ in properties other than non-defining properties",
            Map.of("firstNode", first, "secondNode", group.get(mismatchingPropertyIndex)));
      }
    }

    if (!nonDefiningMismatches.isEmpty()) {
      throw new MismatchingPropertiesProblem(nonDefiningMismatches);
    }
  }

  private void mergeMultivaluedProperties(ModelConfiguration modelConfiguration) {

    Map<String, List<Node>> byConceptId =
        nodes.stream().collect(Collectors.groupingBy(Node::getConceptId));

    for (List<Node> nodeSet : byConceptId.values()) {
      if (nodeSet.size() <= 1) {
        continue;
      }
      final ModelLevel modelLevel =
          modelConfiguration.getLevelOfType(nodeSet.get(0).getModelLevel());
      Set<String> multiValuedPropertySchemes =
          Streams.concat(
                  modelConfiguration.getMappingsByLevel(modelLevel).stream()
                      .filter(BasePropertyWithValueDefinition::isMultiValued)
                      .map(BasePropertyDefinition::getName),
                  modelConfiguration.getNonDefiningPropertiesByLevel(modelLevel).stream()
                      .filter(BasePropertyWithValueDefinition::isMultiValued)
                      .map(BasePropertyDefinition::getName))
              .collect(Collectors.toSet());

      Set<NonDefiningBase> multivaluedProperties =
          nodeSet.stream()
              .flatMap(n -> n.getNonDefiningProperties().stream())
              .filter(p -> multiValuedPropertySchemes.contains(p.getIdentifierScheme()))
              .collect(Collectors.toSet());

      for (Node node : nodeSet) {
        for (NonDefiningBase prop : multivaluedProperties) {
          node.getNonDefiningProperties().add(prop);
        }
      }
    }

    // nodes that might have differed based on multi-valued properties are now merged.
    // remove duplicates.
    Set<Node> rebuilt = new TreeSet<>(createNodeDeduplicationComparator());
    rebuilt.addAll(nodes);
    nodes.clear();
    nodes.addAll(rebuilt);
  }

  @JsonIgnore
  public void deduplicateNewNodes(ModelConfiguration modelConfiguration) {
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
                                    && SnowstormDtoUtil.sameAxioms(
                                        n.getNewConceptDetails().getAxioms(),
                                        node.getNewConceptDetails().getAxioms()))
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

      mergeMultivaluedProperties(modelConfiguration);
      checkNodesForMismatchedProperties(modelConfiguration);
    }
  }
}
