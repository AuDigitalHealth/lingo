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

import au.gov.digitalhealth.lingo.product.ProductBrands;
import au.gov.digitalhealth.lingo.product.ProductPackSizes;
import au.gov.digitalhealth.lingo.util.PartionIdentifier;
import au.gov.digitalhealth.lingo.validation.ValidSctId;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Valid
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BrandPackSizeCreationDetails implements BulkProductActionDetails, Serializable {
  @NotNull
  @ValidSctId(partitionIdentifier = PartionIdentifier.CONCEPT)
  private String productId;

  @Valid private ProductBrands brands;

  @Valid private ProductPackSizes packSizes;

  @JsonIgnore
  public Map<String, String> getIdFsnMap() {
    Map<String, String> returnMap = brands == null ? new HashMap<>() : brands.getIdFsnMap();
    returnMap.putAll(packSizes == null ? Map.of() : packSizes.getIdFsnMap());
    return returnMap;
  }

  @Override
  public String calculateSaveName() {
    return "Brand/pack size " + new Date();
  }
}
