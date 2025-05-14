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
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
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
 * A node in a {@link ProductSummary} which represents a concept with a particular label indicating
 * the type of the node in the context of the product. This DTO can also represent a new concept
 * that has not yet been created in Snowstorm.
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

  @Builder.Default Set<ExternalIdentifier> externalIdentifiers = new HashSet<>();

  ModelLevelType modelLevel;

  public Node(SnowstormConceptMini concept, ModelLevel level) {
    this.concept = concept;
    this.label = level.getDisplayLabel();
    this.displayName = level.getName();
    this.modelLevel = level.getModelLevelType();
  }

  public static Comparator<@Valid Node> getNodeComparator(Set<Node> nodeSet) {
    return new NodeDependencyComparator(nodeSet);
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

  //  public SnowstormConceptMini toConceptMini() {
  //    if (concept != null) {
  //      return getConcept();
  //    } else if (newConceptDetails != null) {
  //      SnowstormConceptMini cm = new SnowstormConceptMini();
  //      return cm.conceptId(newConceptDetails.getConceptId().toString())
  //          .fsn(
  //              new SnowstormTermLangPojo()
  //                  .lang("en")
  //                  .term(newConceptDetails.getFullySpecifiedName()))
  //          .pt(new SnowstormTermLangPojo().lang("en").term(newConceptDetails.getPreferredTerm()))
  //          .idAndFsnTerm(getIdAndFsnTerm())
  //          .definitionStatus(
  //              newConceptDetails.getAxioms().stream()
  //                      .anyMatch(a -> Objects.equals(a.getDefinitionStatus(),
  // DEFINED.getValue()))
  //                  ? DEFINED.getValue()
  //                  : PRIMITIVE.getValue())
  //          .moduleId(AmtConstants.SCT_AU_MODULE.getValue());
  //    } else {
  //      throw new IllegalStateException("Node must represent a concept or a new concept, not
  // both");
  //    }
  //  }
}
