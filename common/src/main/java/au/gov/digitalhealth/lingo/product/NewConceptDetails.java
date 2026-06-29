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
import au.csiro.snowstorm_client.model.SnowstormDescription;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import au.gov.digitalhealth.lingo.product.namegenerator.StrengthFormat;
import au.gov.digitalhealth.lingo.util.PartitionIdentifier;
import au.gov.digitalhealth.lingo.validation.ValidDescription;
import au.gov.digitalhealth.lingo.validation.ValidPreferredTermLength;
import au.gov.digitalhealth.lingo.validation.ValidSctId;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@ValidPreferredTermLength
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
  @ValidSctId(partitionIdentifier = PartitionIdentifier.CONCEPT)
  String specifiedConceptId;

  /**
   * Potentially updated Fully specified name of the concept to be created. This does not include
   * the semantic tag which is in the element below.
   */
  @ValidDescription(fieldName = "fullySpecifiedName")
  @NotNull
  @NotEmpty
  String fullySpecifiedName;

  /** Potentially updated preferred term of the concept to be created. */
  @ValidDescription(fieldName = "preferredTerm")
  @NotNull
  @NotEmpty
  String preferredTerm;

  /**
   * Generated, never updated Fully specified name of the concept to be created. This does not
   * include the semantic tag which is in the element below.
   */
  @NotNull @NotEmpty String generatedFullySpecifiedName;

  /** Generated, never updated Preferred term of the concept to be created. */
  @NotNull @NotEmpty String generatedPreferredTerm;

  /** Semantic tag of the concept to be created. */
  @NotNull @NotEmpty String semanticTag;

  /** Axioms of the concept to be created, usually only one. */
  @NotNull @NotEmpty Set<SnowstormAxiom> axioms = new HashSet<>();

  Set<SnowstormDescription> descriptions;

  Set<SnowstormRelationship> nonDefiningProperties = new HashSet<>();

  Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers = new HashSet<>();

  NameGeneratorSpec nameGeneratorSpec;

  /**
   * Hint passed to the name generator describing how strengths should be rendered in the produced
   * preferred term. Null when the configured name generator does not support the parameter, or when
   * the value has not been derived (legacy data). By convention, also null on pack-level concepts —
   * set only by product-level node construction, not enforced by the type system. Propagated onto
   * the outbound name-generator request via {@link NameGeneratorSpec#strength_format}.
   */
  StrengthFormat strengthFormat;

  /**
   * Brand term passed to the name generator as an out-of-band naming hint for opted-in virtual
   * levels, so the rendered FSN/PT can reflect the brand WITHOUT adding {@code HAS_PRODUCT_NAME} to
   * the concept's axiom. This is a naming hint only — it must never become a defining relationship
   * on a virtual concept. Null unless the model opts in (see {@link
   * au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration#nameGeneratorSupportsProductName})
   * and the level is a virtual Clinical Drug. Propagated onto the outbound request via {@link
   * NameGeneratorSpec#productName}.
   */
  String nameGeneratorProductName;

  /**
   * User-supplied registered branded product name (e.g. from HPRA/PCRS), used to derive the AMP's
   * name in the name generator (medications/bulk-brand) or as the AMP preferred term directly
   * (devices). NMPC-only; null means "derive a best-efforts name from the modelling".
   */
  String brandedProductName;

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

  public String getDefinitionStatusId() {
    return axioms.iterator().next().getDefinitionStatusId();
  }

  public void setFullySpecifiedName(String fsn) {
    this.fullySpecifiedName = fsn;
    this.generatedFullySpecifiedName = fsn;
  }

  public void setPreferredTerm(String pt) {
    this.preferredTerm = pt;
    this.generatedPreferredTerm = pt;
  }

  public boolean isFsnOrPtModified() {
    return (!Objects.equals(this.getGeneratedFullySpecifiedName(), this.getFullySpecifiedName())
        || !Objects.equals(this.getGeneratedPreferredTerm(), this.getPreferredTerm()));
  }
}
