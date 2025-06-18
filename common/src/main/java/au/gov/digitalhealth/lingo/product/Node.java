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
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningBase;
import au.gov.digitalhealth.lingo.validation.OnlyOnePopulated;
import com.fasterxml.jackson.annotation.JsonProperty;
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
public class Node implements Cloneable {
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
    if (isNewConcept()) {
      return newConceptDetails.getPreferredTerm();
    }
    return Objects.requireNonNull(concept.getPt()).getTerm();
  }

  @JsonProperty(value = "fullySpecifiedName", access = JsonProperty.Access.READ_ONLY)
  public String getFullySpecifiedName() {
    if (isNewConcept()) {
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
    return concept == null && newConceptDetails != null;
  }

  /**
   * Returns true if this node represents a new concept, or false if it represents an existing
   * concept.
   */
  @JsonProperty(value = "conceptEdit", access = JsonProperty.Access.READ_ONLY)
  public boolean isConceptEdit() {
    return concept != null && originalNode != null && newConceptDetails != null;
  }

  /**
   * Returns true if this node represents a new concept, or false if it represents an existing
   * concept.
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

  /**
   * Creates a deep copy of this Node object.
   *
   * @return A deep copy of this Node object
   */
  @Override
  public Node clone() {
    try {
      Node cloned = (Node) super.clone();

      // Deep copy concept if it exists
      if (concept != null) {
        SnowstormConceptMini clonedConcept = new SnowstormConceptMini();
        clonedConcept.setConceptId(concept.getConceptId());

        // Clone FSN if it exists
        if (concept.getFsn() != null) {
          SnowstormTermLangPojo clonedFsn = new SnowstormTermLangPojo();
          clonedFsn.setTerm(concept.getFsn().getTerm());
          clonedFsn.setLang(concept.getFsn().getLang());
          clonedConcept.setFsn(clonedFsn);
        }

        // Clone PT if it exists
        if (concept.getPt() != null) {
          SnowstormTermLangPojo clonedPt = new SnowstormTermLangPojo();
          clonedPt.setTerm(concept.getPt().getTerm());
          clonedPt.setLang(concept.getPt().getLang());
          clonedConcept.setPt(clonedPt);
        }

        cloned.concept = clonedConcept;
      }

      // Deep copy collections
      if (conceptOptions != null && !conceptOptions.isEmpty()) {
        cloned.conceptOptions = new ArrayList<>(conceptOptions);
      }

      if (nonDefiningProperties != null && !nonDefiningProperties.isEmpty()) {
        cloned.nonDefiningProperties = new HashSet<>(nonDefiningProperties);
      }

      // Deep copy NewConceptDetails
      if (newConceptDetails != null) {
        NewConceptDetails clonedDetails = new NewConceptDetails();
        clonedDetails.setConceptId(newConceptDetails.getConceptId());
        clonedDetails.setSpecifiedConceptId(newConceptDetails.getSpecifiedConceptId());
        clonedDetails.setFullySpecifiedName(newConceptDetails.getFullySpecifiedName());
        clonedDetails.setPreferredTerm(newConceptDetails.getPreferredTerm());
        clonedDetails.setGeneratedFullySpecifiedName(
            newConceptDetails.getGeneratedFullySpecifiedName());
        clonedDetails.setGeneratedPreferredTerm(newConceptDetails.getGeneratedPreferredTerm());
        clonedDetails.setSemanticTag(newConceptDetails.getSemanticTag());

        // Deep copy collections in NewConceptDetails
        if (newConceptDetails.getAxioms() != null && !newConceptDetails.getAxioms().isEmpty()) {
          clonedDetails.setAxioms(new HashSet<>(newConceptDetails.getAxioms()));
        }

        if (newConceptDetails.getNonDefiningProperties() != null
            && !newConceptDetails.getNonDefiningProperties().isEmpty()) {
          clonedDetails.setNonDefiningProperties(
              new HashSet<>(newConceptDetails.getNonDefiningProperties()));
        }

        if (newConceptDetails.getReferenceSetMembers() != null
            && !newConceptDetails.getReferenceSetMembers().isEmpty()) {
          clonedDetails.setReferenceSetMembers(
              new HashSet<>(newConceptDetails.getReferenceSetMembers()));
        }

        cloned.newConceptDetails = clonedDetails;
      }

      // Handle circular reference with OriginalNode
      if (originalNode != null) {
        OriginalNode clonedOriginalNode = new OriginalNode();
        clonedOriginalNode.setInactivationReason(originalNode.getInactivationReason());
        clonedOriginalNode.setReferencedByOtherProducts(originalNode.isReferencedByOtherProducts());

        // Clone the node inside originalNode
        if (originalNode.getNode() != null) {
          Node innerNode = originalNode.getNode();
          Node clonedInnerNode = new Node();

          // Copy all properties from the inner node
          if (innerNode.getConcept() != null) {
            SnowstormConceptMini innerConcept = innerNode.getConcept();
            SnowstormConceptMini clonedInnerConcept = new SnowstormConceptMini();
            clonedInnerConcept.setConceptId(innerConcept.getConceptId());

            // Clone FSN if it exists
            if (innerConcept.getFsn() != null) {
              SnowstormTermLangPojo clonedFsn = new SnowstormTermLangPojo();
              clonedFsn.setTerm(innerConcept.getFsn().getTerm());
              clonedFsn.setLang(innerConcept.getFsn().getLang());
              clonedInnerConcept.setFsn(clonedFsn);
            }

            // Clone PT if it exists
            if (innerConcept.getPt() != null) {
              SnowstormTermLangPojo clonedPt = new SnowstormTermLangPojo();
              clonedPt.setTerm(innerConcept.getPt().getTerm());
              clonedPt.setLang(innerConcept.getPt().getLang());
              clonedInnerConcept.setPt(clonedPt);
            }

            clonedInnerNode.setConcept(clonedInnerConcept);
          }

          // Copy other properties
          clonedInnerNode.setLabel(innerNode.getLabel());
          clonedInnerNode.setDisplayName(innerNode.getDisplayName());
          clonedInnerNode.setNewInTask(innerNode.isNewInTask());
          clonedInnerNode.setNewInProject(innerNode.isNewInProject());
          clonedInnerNode.setModelLevel(innerNode.getModelLevel());

          // Deep copy collections
          if (innerNode.getConceptOptions() != null && !innerNode.getConceptOptions().isEmpty()) {
            clonedInnerNode.setConceptOptions(new ArrayList<>(innerNode.getConceptOptions()));
          }

          if (innerNode.getNonDefiningProperties() != null
              && !innerNode.getNonDefiningProperties().isEmpty()) {
            clonedInnerNode.setNonDefiningProperties(
                new HashSet<>(innerNode.getNonDefiningProperties()));
          }

          // Deep copy NewConceptDetails if it exists
          if (innerNode.getNewConceptDetails() != null) {
            NewConceptDetails innerDetails = innerNode.getNewConceptDetails();
            NewConceptDetails clonedInnerDetails = new NewConceptDetails();
            clonedInnerDetails.setConceptId(innerDetails.getConceptId());
            clonedInnerDetails.setSpecifiedConceptId(innerDetails.getSpecifiedConceptId());
            clonedInnerDetails.setFullySpecifiedName(innerDetails.getFullySpecifiedName());
            clonedInnerDetails.setPreferredTerm(innerDetails.getPreferredTerm());
            clonedInnerDetails.setGeneratedFullySpecifiedName(
                innerDetails.getGeneratedFullySpecifiedName());
            clonedInnerDetails.setGeneratedPreferredTerm(innerDetails.getGeneratedPreferredTerm());
            clonedInnerDetails.setSemanticTag(innerDetails.getSemanticTag());

            // Deep copy collections in NewConceptDetails
            if (innerDetails.getAxioms() != null && !innerDetails.getAxioms().isEmpty()) {
              clonedInnerDetails.setAxioms(new HashSet<>(innerDetails.getAxioms()));
            }

            if (innerDetails.getNonDefiningProperties() != null
                && !innerDetails.getNonDefiningProperties().isEmpty()) {
              clonedInnerDetails.setNonDefiningProperties(
                  new HashSet<>(innerDetails.getNonDefiningProperties()));
            }

            if (innerDetails.getReferenceSetMembers() != null
                && !innerDetails.getReferenceSetMembers().isEmpty()) {
              clonedInnerDetails.setReferenceSetMembers(
                  new HashSet<>(innerDetails.getReferenceSetMembers()));
            }

            clonedInnerNode.setNewConceptDetails(clonedInnerDetails);
          }

          // Don't clone the originalNode of the inner node to avoid infinite recursion

          clonedOriginalNode.setNode(clonedInnerNode);
        }

        cloned.originalNode = clonedOriginalNode;
      }

      return cloned;
    } catch (CloneNotSupportedException e) {
      throw new RuntimeException("Failed to clone Node", e);
    }
  }
}
