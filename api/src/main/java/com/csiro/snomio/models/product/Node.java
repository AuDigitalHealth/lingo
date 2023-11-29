package com.csiro.snomio.models.product;

import static com.csiro.snomio.util.SnomedConstants.DEFINED;
import static com.csiro.snomio.util.SnomedConstants.PRIMITIVE;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import com.csiro.snomio.exception.CoreferentNodesProblem;
import com.csiro.snomio.util.AmtConstants;
import com.csiro.snomio.validation.OnlyOnePopulated;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.Collections;
import java.util.Comparator;
import java.util.Objects;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A node in a {@link ProductSummary} which represents a concept with a particular label indicating
 * the type of the node in the context of the product. This DTO can also represent a new concept
 * that has not yet been created in Snowstorm.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@OnlyOnePopulated(
    fields = {"concept", "newConceptDetails"},
    message = "Node must represent a concept or a new concept, not both")
public class Node {
  /**
   * Existing concept in the terminology for this node. Either this element or newConceptDetails is
   * populated, not both.
   */
  SnowstormConceptMini concept;

  /** Label for this node indicating its place in the model. */
  @NotNull @NotEmpty String label;

  /**
   * Details of a new concept that has not yet been created in the terminology. Either this element
   * or concept is populated, not both.
   */
  @Valid NewConceptDetails newConceptDetails;

  public Node(SnowstormConceptMini concept, String label) {
    this.concept = concept;
    this.label = label;
  }

  public static Comparator<@Valid Node> getNodeComparator() {
    return (o1, o2) -> {
      if (o1.getNewConceptDetails().containsTarget(o2.getNewConceptDetails().getConceptId())
          && o2.getNewConceptDetails().containsTarget(o1.getNewConceptDetails().getConceptId())) {
        throw new CoreferentNodesProblem(o1, o2);
      }

      if (o1.getNewConceptDetails().containsTarget(o2.getNewConceptDetails().getConceptId())) {
        return 1;
      } else if (o2.getNewConceptDetails()
          .containsTarget(o1.getNewConceptDetails().getConceptId())) {
        return -1;
      } else if (o1.getNewConceptDetails().refersToUuid()
          && !o2.getNewConceptDetails().refersToUuid()) {
        return 1;
      } else if (o2.getNewConceptDetails().refersToUuid()
          && !o1.getNewConceptDetails().refersToUuid()) {
        return -1;
      } else {
        return 0;
      }
    };
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
    if (newConceptDetails.getSpecifiedConceptId() != null
        && !newConceptDetails
            .getSpecifiedConceptId()
            .equalsIgnoreCase(newConceptDetails.getConceptId().toString())) {
      return newConceptDetails.getSpecifiedConceptId();
    } else {
      return newConceptDetails.getConceptId().toString();
    }
  }

  /** Returns the concept represented by this node as ID and FSN, usually for logging. */
  @JsonProperty(value = "idAndFsnTerm", access = JsonProperty.Access.READ_ONLY)
  public String getIdAndFsnTerm() {
    if (concept != null) {
      return concept.getIdAndFsnTerm();
    }
    return getConceptId() + "| " + newConceptDetails.getFullySpecifiedName() + "|";
  }

  public String getPreferredTerm() {
    if (isNewConcept()) {
      return newConceptDetails.getPreferredTerm();
    }
    return Objects.requireNonNull(concept.getPt()).getTerm();
  }

  public String getFullySpecifiedName() {
    if (isNewConcept()) {
      return newConceptDetails.getFullySpecifiedName();
    }
    return Objects.requireNonNull(concept.getFsn()).getTerm();
  }

  public Set<SnowstormAxiom> getAxioms() {
    if (isNewConcept()) {
      return newConceptDetails.getAxioms();
    }
    // TODO: Need to handle for existing concepts
    return Collections.emptySet();
  }

  public Set<SnowstormReferenceSetMemberViewComponent> getReferenceSetMembers() {
    if (isNewConcept()) {
      return newConceptDetails.getReferenceSetMembers();
    }
    // TODO: Need to handle for existing concepts
    return Collections.emptySet();
  }

  /**
   * Returns true if this node represents a new concept, or false if it represents an existing
   * concept.
   */
  @JsonProperty(value = "newConcept", access = JsonProperty.Access.READ_ONLY)
  public boolean isNewConcept() {
    return newConceptDetails != null;
  }

  public SnowstormConceptMini toConceptMini() {
    if (concept != null) {
      return getConcept();
    } else if (newConceptDetails != null) {
      SnowstormConceptMini cm = new SnowstormConceptMini();
      return cm.conceptId(newConceptDetails.getConceptId().toString())
          .fsn(
              new SnowstormTermLangPojo()
                  .lang("en")
                  .term(newConceptDetails.getFullySpecifiedName()))
          .pt(new SnowstormTermLangPojo().lang("en").term(newConceptDetails.getPreferredTerm()))
          .idAndFsnTerm(getIdAndFsnTerm())
          .definitionStatus(
              newConceptDetails.getAxioms().stream()
                      .anyMatch(a -> Objects.equals(a.getDefinitionStatus(), DEFINED.getValue()))
                  ? DEFINED.getValue()
                  : PRIMITIVE.getValue())
          .moduleId(AmtConstants.SCT_AU_MODULE.getValue());
    } else {
      throw new IllegalStateException("Node must represent a concept or a new concept, not both");
    }
  }
}
