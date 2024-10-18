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

  List<@Valid Ingredient> activeIngredients = new ArrayList<>();

  @Override
  protected Map<String, String> getSpecialisedIdFsnMap() {
    Map<String, String> idMap = new HashMap<>();
    if (genericForm != null) {
      idMap.put(genericForm.getConceptId(), genericForm.getFsn().getTerm());
    }
    if (specificForm != null) {
      idMap.put(specificForm.getConceptId(), specificForm.getFsn().getTerm());
    }
    if (quantity != null) {
      idMap.putAll(quantity.getIdFsnMap());
    }
    if (containerType != null) {
      idMap.put(containerType.getConceptId(), containerType.getFsn().getTerm());
    }
    for (Ingredient ingredient : activeIngredients) {
      idMap.putAll(ingredient.getIdFsnMap());
    }
    return idMap;
  }
}
