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
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import au.gov.digitalhealth.lingo.validation.OnlyOneNotEmpty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
@OnlyOneNotEmpty(
    fields = {"containedProducts", "containedPackages"},
    message = "Either containedProducts or containedPackages must be populated, but not both")
public class PackageDetails<T extends ProductDetails> extends PackageProductDetailsBase {
  SnowstormConceptMini productName;
  SnowstormConceptMini containerType;
  List<@Valid ProductQuantity<T>> containedProducts = new ArrayList<>();
  List<@Valid PackageQuantity<T>> containedPackages = new ArrayList<>();
  List<String> selectedConceptIdentifiers = new ArrayList<>();

  @JsonIgnore
  public Map<String, String> getIdFsnMap() {
    Map<String, String> idMap = new HashMap<>();
    if (productName != null) {
      idMap.put(productName.getConceptId(), SnowstormDtoUtil.getFsnTerm(productName));
    }
    if (containerType != null) {
      idMap.put(containerType.getConceptId(), SnowstormDtoUtil.getFsnTerm(containerType));
    }
    for (ProductQuantity<T> productQuantity : containedProducts) {
      idMap.putAll(productQuantity.getIdFsnMap());
    }
    for (PackageQuantity<T> packageQuantity : containedPackages) {
      idMap.putAll(packageQuantity.getIdFsnMap());
    }
    return idMap;
  }
}
