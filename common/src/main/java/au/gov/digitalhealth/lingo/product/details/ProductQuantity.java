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
package au.gov.digitalhealth.lingo.product.details;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ProductQuantity<T extends ProductDetails> extends ProductBaseDto {
  @NotNull @Valid Quantity packSize;
  @NotNull @Valid T productDetails;

  @JsonIgnore
  public BigDecimal getValue() {
    return packSize.getValue();
  }

  public void setValue(BigDecimal singleActiveBigDecimal) {
    if (packSize == null) {
      packSize = new Quantity();
    }
    packSize.setValue(singleActiveBigDecimal);
  }

  @Override
  @JsonIgnore
  public Map<String, String> getIdFsnMap() {
    Map<String, String> idMap = addToIdFsnMap(null, productDetails);
    addToIdFsnMap(idMap, packSize);
    return idMap;
  }

  @JsonIgnore
  public SnowstormConceptMini getUnit() {
    return packSize.getUnit();
  }

  public void setUnit(SnowstormConceptMini singleActiveTarget) {
    if (packSize == null) {
      packSize = new Quantity();
    }
    packSize.setUnit(singleActiveTarget);
  }
}
