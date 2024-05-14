package com.csiro.snomio.product;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import com.csiro.snomio.util.PartionIdentifier;
import com.csiro.snomio.validation.ValidSctId;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.HashSet;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class NewConceptDetails {
  /**
   * A temporary identifier for this new concept as a placeholder, is used in Edges in the product
   * summary.
   */
  @NotNull Integer conceptId;

  /**
   * The SCTID of the concept to be created if the user wants to use a specific SCTID. This is
   * optional, if not specified a new concept will be created with a random SCTID.
   */
  @ValidSctId(partitionIdentifier = PartionIdentifier.CONCEPT)
  String specifiedConceptId;

  /**
   * Fully specified name of the concept to be created. This does not include the semantic tag which
   * is in the element below.
   */
  @NotNull @NotEmpty String fullySpecifiedName;

  /** Preferred term of the concept to be created. */
  @NotNull @NotEmpty String preferredTerm;

  /** Semantic tag of the concept to be created. */
  @NotNull @NotEmpty String semanticTag;

  /** Axioms of the concept to be created, usually only one. */
  @NotNull @NotEmpty Set<SnowstormAxiom> axioms = new HashSet<>();

  Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers = new HashSet<>();

  public NewConceptDetails(int conceptId) {
    this.conceptId = conceptId;
  }

  // Added the below getters to include data in the payload the concept diagram rendering needs
  public SnowstormTermLangPojo getFsn() {
    return new SnowstormTermLangPojo().term(fullySpecifiedName).lang("en");
  }

  public SnowstormTermLangPojo getPt() {
    return new SnowstormTermLangPojo().term(preferredTerm).lang("en");
  }

  public boolean isActive() {
    return true;
  }

  public boolean isReleased() {
    return false;
  }

  public String getModuleId() {
    return axioms.iterator().next().getModuleId();
  }

  public String getDefinitionStatus() {
    return axioms.iterator().next().getDefinitionStatus();
  }
}
