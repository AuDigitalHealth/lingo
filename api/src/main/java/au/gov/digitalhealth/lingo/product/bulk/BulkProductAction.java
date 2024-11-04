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
package au.gov.digitalhealth.lingo.product.bulk;

import au.gov.digitalhealth.lingo.product.ProductSummary;
import jakarta.validation.Valid;
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
public class BulkProductAction<T extends BulkProductActionDetails> implements Serializable {
  /** Summary of the product concepts that exist and to create */
  @NotNull @Valid ProductSummary productSummary;

  /** Data used to calculate the product summary */
  @NotNull @Valid T details;

  /** Ticket to record this against */
  @NotNull Long ticketId;

  /**
   * The name of a previous partial save of the details loaded and completed to create this product
   * - will be overwritten with the creation product details.
   */
  String partialSaveName;

  public String calculateSaveName() {
    return details.calculateSaveName();
  }
}
