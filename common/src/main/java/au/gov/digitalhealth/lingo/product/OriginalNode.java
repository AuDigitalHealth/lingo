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

import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.util.InactivationReason;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.AssertTrue;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.http.HttpStatus;

@Data
@Builder(access = AccessLevel.PRIVATE)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor
public class OriginalNode {
  private Node node;
  private InactivationReason inactivationReason;
  private boolean referencedByOtherProducts;

  /**
   * True when the original concept is owned by an external module — e.g. a SNOMED CT International
   * concept reused by an NMPC or AMT product — and so the authoring tool cannot retire or modify
   * it. Read by {@link Node#isReplaceWithoutRetire()} to route the update through the cleanup
   * path: the original concept's memberships in the configured in-scope reference sets are
   * cleared and a new concept is created in its place, with no inactivation indicator or
   * historical association.
   *
   * <p>This flag describes the original concept's module ownership only; whether {@link
   * Node#isReplaceWithoutRetire()} actually fires also depends on {@link
   * #referencedByOtherProducts} — when other products still reference the original concept it is
   * left untouched regardless of this flag.
   *
   * <p>The Lombok setter is suppressed and the JSON binding is {@link JsonProperty.Access#READ_ONLY}
   * so that the flag can only be set inside the package via {@link #of(Node, InactivationReason,
   * boolean, String)}. A client submitting a payload with {@code externalConcept} present in the
   * JSON has the value ignored on the server side; service-layer entry points must re-derive the
   * flag from the original concept's moduleId before consuming the {@code ProductSummary} so the
   * server is the source of truth (see {@code ProductCreationService#normaliseExternalConceptFlag}).
   */
  @Setter(AccessLevel.NONE)
  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  private boolean externalConcept;

  /**
   * The supported way to construct an {@code OriginalNode}. Derives {@link #externalConcept} by
   * comparing the original concept's moduleId to the supplied authoring moduleId; the all-args
   * constructor is intentionally private to prevent callers from setting the flag directly and
   * bypassing this comparison.
   *
   * <p>{@code authoringModuleId} may be {@code null} when the caller doesn't have access to the
   * model configuration (e.g. some test fixtures); in that case the flag is set to {@code false}.
   * Today all production callers supply {@code modelConfiguration.getModuleId()}.
   */
  public static OriginalNode of(
      Node node,
      InactivationReason inactivationReason,
      boolean referencedByOtherProducts,
      String authoringModuleId) {
    OriginalNode result = new OriginalNode();
    result.node = node;
    result.inactivationReason = inactivationReason;
    result.referencedByOtherProducts = referencedByOtherProducts;
    result.externalConcept = isExternalConcept(node, authoringModuleId);
    return result;
  }

  private static boolean isExternalConcept(Node node, String authoringModuleId) {
    // The only legitimate null case is when the caller doesn't have a model configuration
    // available (test fixtures); production paths always supply the authoring moduleId. Other
    // nulls are programmer errors or malformed Snowstorm responses and must surface — silently
    // treating an external concept as authorable would mis-route a SNOMED CT International
    // concept down the edit/retire path.
    if (authoringModuleId == null) {
      return false;
    }
    if (node == null || node.getConcept() == null) {
      throw new LingoProblem(
          "original-node-construction",
          "Cannot determine concept externality: original node or its concept is null",
          HttpStatus.INTERNAL_SERVER_ERROR);
    }
    String originalModuleId = node.getConcept().getModuleId();
    if (originalModuleId == null) {
      throw new LingoProblem(
          "original-node-construction",
          "Concept "
              + node.getConceptId()
              + " has no moduleId; cannot determine externality. Ensure moduleId is included in"
              + " the requested concept fields.",
          HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return !originalModuleId.equals(authoringModuleId);
  }

  @JsonProperty(value = "conceptId", access = JsonProperty.Access.READ_ONLY)
  public String getConceptId() {
    return node.getConceptId();
  }

  /**
   * Inactivation reasons are only meaningful for concepts the authoring tool is allowed to
   * retire. An external concept (owned by a foreign module) is replaced without retirement, so
   * carrying a reason on it indicates a contradictory request. Surface as a JSR-303 validation
   * failure at any {@code @Valid} boundary so the bad state cannot silently flow through to the
   * service layer.
   */
  @AssertTrue(message = "An external original concept cannot carry an inactivation reason")
  @JsonIgnore
  public boolean isExternalConceptInactivationReasonConsistent() {
    return !externalConcept || inactivationReason == null;
  }
}
