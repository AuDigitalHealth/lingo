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

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class PackageQuantity<T extends ProductDetails> extends Quantity {
  @NotNull @Valid PackageDetails<T> packageDetails;

  @Override
  @JsonIgnore
  public Map<String, String> getIdFsnMap() {
    Map<String, String> idMap = packageDetails.getIdFsnMap();
    idMap.putAll(super.getIdFsnMap());
    return idMap;
  }

  @Override
  @JsonIgnore
  public Map<String, String> getIdPtMap() {
    Map<String, String> idMap = packageDetails.getIdPtMap();
    idMap.putAll(super.getIdPtMap());
    return idMap;
  }
}
