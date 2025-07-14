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

import au.gov.digitalhealth.lingo.product.update.ProductUpdateState;
import au.gov.digitalhealth.lingo.util.PartionIdentifier;
import au.gov.digitalhealth.lingo.validation.ValidSctId;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.Date;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductUpdateCreationDetails implements BulkProductActionDetails, Serializable {
  @NotNull
  @ValidSctId(partitionIdentifier = PartionIdentifier.CONCEPT)
  private String productId;

  private ProductUpdateState historicState;

  private ProductUpdateState updatedState;

  @Override
  public String calculateSaveName() {
    return "Product Update " + new Date();
  }
}
