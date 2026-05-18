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

import au.gov.digitalhealth.lingo.util.InactivationReason;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OriginalNode {
  private Node node;
  private InactivationReason inactivationReason;
  private boolean referencedByOtherProducts;

  /**
   * True when the original concept is owned by an external module (e.g. SNOMED CT International core
   * metadata module) and so cannot be edited in place or retired by this authoring tool. When true,
   * the concept will be removed from the authoring module's reference sets and a new concept will be
   * created in its place without any historical association.
   */
  private boolean externalConcept;

  /**
   * Convenience constructor that derives {@link #externalConcept} by comparing the original
   * concept's moduleId to the supplied authoring module id. Pass {@code null} for the authoring
   * module id when the caller cannot determine externality at construction time (the flag will
   * default to {@code false} and may be set later).
   */
  public OriginalNode(
      Node node,
      InactivationReason inactivationReason,
      boolean referencedByOtherProducts,
      String authoringModuleId) {
    this.node = node;
    this.inactivationReason = inactivationReason;
    this.referencedByOtherProducts = referencedByOtherProducts;
    this.externalConcept = isExternalConcept(node, authoringModuleId);
  }

  private static boolean isExternalConcept(Node node, String authoringModuleId) {
    if (authoringModuleId == null || node == null || node.getConcept() == null) {
      return false;
    }
    String originalModuleId = node.getConcept().getModuleId();
    return originalModuleId != null && !originalModuleId.equals(authoringModuleId);
  }

  @JsonProperty(value = "conceptId", access = JsonProperty.Access.READ_ONLY)
  public String getConceptId() {
    return node.getConceptId();
  }
}
