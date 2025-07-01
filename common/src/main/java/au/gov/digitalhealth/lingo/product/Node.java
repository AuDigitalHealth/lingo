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
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningBase;
import au.gov.digitalhealth.lingo.validation.OnlyOnePopulated;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.java.Log;

/**
 * A node in a product summary which represents a concept with a particular label indicating the
 * type of the node in the context of the product. This DTO can also represent a new concept that
 * has not yet been created in Snowstorm.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Log
@OnlyOnePopulated(
    fields = {"concept", "newConceptDetails"},
    message = "Node must represent a concept or a new concept, not both")
public class Node {
  /**
   * Existing concept in the terminology for this node. Either this element or newConceptDetails is
   * populated, not both.
   */
  SnowstormConceptMini concept;

  /**
   * Options for concepts that may match the right result for this node for the user to select from.
   */
  @Builder.Default Collection<SnowstormConceptMini> conceptOptions = Collections.emptyList();

  /** Label for this node indicating its place in the model. */
  @NotNull @NotEmpty String label;

  @JsonProperty @NotNull @NotEmpty String displayName;

  /**
   * Details of a new concept that has not yet been created in the terminology. Either this element
   * or concept is populated, not both.
   */
  @Valid NewConceptDetails newConceptDetails;

  /** Indicates if this node is new in the task. */
  boolean newInTask;

  /** Indicates if this node is new in the project. */
  boolean newInProject;

  @Builder.Default Set<@Valid NonDefiningBase> nonDefiningProperties = new HashSet<>();

  OriginalNode originalNode;

  ModelLevelType modelLevel;

  @Builder.Default Collection<SnowstormRelationship> relationships = new HashSet<>();
  @Builder.Default Collection<SnowstormAxiom> axioms = new HashSet<>();
  @Builder.Default Collection<SnowstormReferenceSetMember> historicalAssociations = new HashSet<>();

  public Node(SnowstormConceptMini concept, ModelLevel level) {
    this.concept = concept;
    this.label = level.getDisplayLabel();
    this.displayName = level.getName();
    this.modelLevel = level.getModelLevelType();
  }

  public static Comparator<@Valid Node> getNewNodeComparator(Set<Node> nodeSet) {
    return new NewNodeDependencyComparator(nodeSet);
  }

  /**
   * Returns the concept ID of the concept represented by this node. If the node represents an
   * existing concept that ID will be returned, otherwise if it represents a new concept the
   * temporary concept ID will be returned. Either way this will be the ID used in the edges of the
   * product model.
   */
  @JsonProperty(value = "conceptId", access = JsonProperty.Access.READ_ONLY)
  public String getConceptId() {
    if (concept != null) {
      return concept.getConceptId();
    }

    return newConceptDetails.getConceptId().toString();
  }

  /** Returns the concept represented by this node as ID and FSN, usually for logging. */
  @JsonProperty(value = "idAndFsnTerm", access = JsonProperty.Access.READ_ONLY)
  public String getIdAndFsnTerm() {
    if (concept != null) {
      return concept.getIdAndFsnTerm();
    }
    return getConceptId() + "| " + newConceptDetails.getFullySpecifiedName() + "|";
  }

  @JsonProperty(value = "preferredTerm", access = JsonProperty.Access.READ_ONLY)
  public String getPreferredTerm() {
    if (concept == null && newConceptDetails != null) {
      return newConceptDetails.getPreferredTerm();
    }
    return Objects.requireNonNull(concept.getPt()).getTerm();
  }

  @JsonProperty(value = "fullySpecifiedName", access = JsonProperty.Access.READ_ONLY)
  public String getFullySpecifiedName() {
    if (concept == null && newConceptDetails != null) {
      return newConceptDetails.getFullySpecifiedName();
    }
    return Objects.requireNonNull(concept.getFsn()).getTerm();
  }

  /**
   * Returns true if this node represents a new concept, or false if it represents an existing
   * concept.
   */
  @JsonProperty(value = "newConcept", access = JsonProperty.Access.READ_ONLY)
  public boolean isNewConcept() {
    return concept == null && newConceptDetails != null && !isRetireAndReplace();
  }

  /** Returns true if this node represents a retire and replace operation. */
  @JsonProperty(value = "retireAndReplace", access = JsonProperty.Access.READ_ONLY)
  public boolean isRetireAndReplace() {
    return newConceptDetails != null
        && originalNode != null
        && !originalNode.isReferencedByOtherProducts()
        && originalNode.getInactivationReason() != null;
  }

  /**
   * Returns true if this node represents a retire and replace operation with an existing concept.
   */
  @JsonProperty(value = "retireAndReplaceWithExisting", access = JsonProperty.Access.READ_ONLY)
  public boolean isRetireAndReplaceWithExisting() {
    return newConceptDetails == null
        && concept != null
        && originalNode != null
        && !originalNode.getNode().getConceptId().equals(concept.getConceptId())
        && originalNode.getInactivationReason() != null;
  }

  /**
   * Returns true if this node represents a concept edit, which means it has an original node and
   * the concept details have changed. This may also include property changes.
   */
  @JsonProperty(value = "conceptEdit", access = JsonProperty.Access.READ_ONLY)
  public boolean isConceptEdit() {
    return originalNode != null
        && newConceptDetails != null
        && !originalNode.isReferencedByOtherProducts()
        && originalNode.getInactivationReason() == null;
  }

  /**
   * Returns true if this node represents a property update, which means it has an original node and
   * the non-defining properties have changed, but the concept details haven't changed.
   */
  @JsonProperty(value = "propertyUpdate", access = JsonProperty.Access.READ_ONLY)
  public boolean isPropertyUpdate() {
    return concept != null
        && originalNode != null
        && newConceptDetails == null
        && (!originalNode.getNode().getNonDefiningProperties().containsAll(nonDefiningProperties)
            || !nonDefiningProperties.containsAll(
                originalNode.getNode().getNonDefiningProperties()));
  }

  @JsonProperty(value = "statedFormChanged", access = JsonProperty.Access.READ_ONLY)
  public boolean isStatedFormChanged() {
    return originalNode != null
        && (!axioms.containsAll(originalNode.getNode().getAxioms())
            || !originalNode.getNode().getAxioms().containsAll(axioms));
  }

  @JsonProperty(value = "inferredFormChanged", access = JsonProperty.Access.READ_ONLY)
  public boolean isInferredFormChanged() {
    return originalNode != null
        && (!relationships.containsAll(originalNode.getNode().getRelationships())
            || !originalNode.getNode().getRelationships().containsAll(relationships));
  }

  /**
   * Creates a deep copy of this Node object.
   *
   * @return A deep copy of this Node object
   */
  public Node cloneNode() {
    try {
      ObjectMapper mapper = new ObjectMapper();
      return mapper.readValue(mapper.writeValueAsString(this), Node.class);
    } catch (Exception e) {
      throw new LingoProblem(
          "An error occurred while cloning the Node object: " + e.getMessage(), e);
    }
  }
}
