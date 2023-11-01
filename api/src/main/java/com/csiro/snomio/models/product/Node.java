package com.csiro.snomio.models.product;

import static com.csiro.snomio.util.SnomedConstants.DEFINED;
import static com.csiro.snomio.util.SnomedConstants.PRIMITIVE;

import au.csiro.snowstorm_client.model.SnowstormConceptMiniComponent;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojoComponent;
import com.csiro.snomio.util.AmtConstants;
import com.csiro.snomio.validation.OnlyOnePopulated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
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
  SnowstormConceptMiniComponent concept;
  @NotNull @NotEmpty String label;
  @Valid NewConceptDetails newConceptDetails;

  public Node(SnowstormConceptMiniComponent concept, String label) {
    this.concept = concept;
    this.label = label;
  }

  public String getConceptId() {
    if (concept != null) {
      return concept.getConceptId();
    }
    return newConceptDetails.getConceptId().toString();
  }

  public String getIdAndFsnTerm() {
    if (concept != null) {
      return concept.getIdAndFsnTerm();
    }
    return newConceptDetails.getConceptId().toString()
        + "| "
        + newConceptDetails.getFullySpecifiedName()
        + "|";
  }

  public boolean isNewConcept() {
    return newConceptDetails != null;
  }

  public SnowstormConceptMiniComponent toConceptMini() {
    if (concept != null) {
      return getConcept();
    } else if (newConceptDetails != null) {
      SnowstormConceptMiniComponent cm = new SnowstormConceptMiniComponent();
      return cm.conceptId(newConceptDetails.getConceptId().toString())
          .fsn(
              new SnowstormTermLangPojoComponent()
                  .lang("en")
                  .term(newConceptDetails.getFullySpecifiedName()))
          .pt(
              new SnowstormTermLangPojoComponent()
                  .lang("en")
                  .term(newConceptDetails.getPreferredTerm()))
          .idAndFsnTerm(getIdAndFsnTerm())
          .definitionStatus(
              newConceptDetails.getAxioms().stream()
                      .anyMatch(a -> a.getDefinitionStatus().equals(DEFINED))
                  ? DEFINED
                  : PRIMITIVE)
          .moduleId(AmtConstants.SCT_AU_MODULE);
    } else {
      throw new IllegalStateException("Node must represent a concept or a new concept, not both");
    }
  }
}
