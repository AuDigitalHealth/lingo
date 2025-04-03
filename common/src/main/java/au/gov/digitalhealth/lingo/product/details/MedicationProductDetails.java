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
import au.gov.digitalhealth.lingo.validation.OnlyOnePopulated;
import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@OnlyOnePopulated(
    fields = {"containerType", "deviceType"},
    message = "Only container type or device type can be populated, not both")
public class MedicationProductDetails extends ProductDetails {
  SnowstormConceptMini genericForm;
  SnowstormConceptMini specificForm;

  // These are the old unit of use/presentation attributes needed until purged
  @Valid Quantity quantity;
  SnowstormConceptMini containerType;
  SnowstormConceptMini deviceType;

  List<@Valid Ingredient> activeIngredients = new ArrayList<>();

  @Override
  protected Map<String, String> getSpecialisedIdFsnMap() {
    Map<String, String> idMap = addToIdFsnMap(null, quantity);
    if (genericForm != null) {
      addToIdFsnMap(idMap, genericForm);
    }
    if (specificForm != null) {
      addToIdFsnMap(idMap, specificForm);
    }
    if (quantity != null) {
      idMap.putAll(quantity.getIdFsnMap());
    }
    if (containerType != null) {
      addToIdFsnMap(idMap, containerType);
    }
    if (deviceType != null) {
      addToIdFsnMap(idMap, deviceType);
    }
    for (Ingredient ingredient : activeIngredients) {
      addToIdFsnMap(idMap, ingredient);
    }
    return idMap;
  }

  public boolean hasDeviceType() {
    return deviceType != null;
  }
}
