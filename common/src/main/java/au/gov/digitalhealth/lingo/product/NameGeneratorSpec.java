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

import au.gov.digitalhealth.lingo.product.namegenerator.StrengthFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class NameGeneratorSpec {

  String tag;
  String owl;
  String pt_owl;
  List<String> order;

  /**
   * Hint for how the name generator should render strengths in the produced preferred term.
   * Optional on the wire — absent ({@code @JsonInclude(NON_NULL)}) means "use the generator's
   * default" (which equates to {@code inference}). Populated from {@link
   * NewConceptDetails#getStrengthFormat()} during spec construction. Wire form is {@code
   * strength_format} (snake_case to match the name generator's API contract).
   */
  @JsonInclude(JsonInclude.Include.NON_NULL)
  @JsonProperty("strength_format")
  StrengthFormat strengthFormat;

  /**
   * Brand term passed to the name generator as a NAMING-ONLY hint so it can be woven into the
   * produced FSN/PT without the brand being part of the concept's logical definition (axiom).
   * Populated only for virtual levels in models that opt in via {@link
   * au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration#nameGeneratorSupportsProductName}
   * (e.g. the NMPC Clinical Drug level). This is a hint only — it must never be added as a {@code
   * HAS_PRODUCT_NAME} relationship on a virtual concept. Optional on the wire ({@code
   * @JsonInclude(NON_NULL)}) — absent means "no brand hint". Wire form is {@code product_name}
   * (snake_case to match the name generator's API contract).
   */
  @JsonInclude(JsonInclude.Include.NON_NULL)
  @JsonProperty("product_name")
  String productName;

  /** Convenience constructor preserving the legacy four-arg signature used by call sites. */
  public NameGeneratorSpec(String tag, String owl, String ptOwl, List<String> order) {
    this.tag = tag;
    this.owl = owl;
    this.pt_owl = ptOwl;
    this.order = order;
    this.strengthFormat = null;
    this.productName = null;
  }
}
