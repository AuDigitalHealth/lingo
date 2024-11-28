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
package au.gov.digitalhealth.lingo.product.update;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Valid
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductDescriptionUpdateRequest implements Serializable {

  private String fullySpecifiedName;
  private String preferredTerm;

  /** Ticket to record this against */
  @NotNull Long ticketId;

  /** Validation to ensure at least one of the fields is provided */
  @AssertTrue(message = "At least one of fullySpecifiedName or preferredTerm must be valid")
  public boolean isAtLeastOneFieldValid() {
    return isValidFullySpecifiedName() || isValidPreferredTerm();
  }

  /**
   * Validate fullySpecifiedName.
   *
   * @return true if fullySpecifiedName is non-null and non-empty
   */
  public boolean isValidFullySpecifiedName() {
    return fullySpecifiedName != null && !fullySpecifiedName.trim().isEmpty();
  }

  /**
   * Validate preferredTerm.
   *
   * @return true if preferredTerm is non-null and non-empty
   */
  public boolean isValidPreferredTerm() {
    return preferredTerm != null && !preferredTerm.trim().isEmpty();
  }
}
