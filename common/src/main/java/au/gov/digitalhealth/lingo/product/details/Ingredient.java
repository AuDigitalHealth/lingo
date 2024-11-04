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
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.HashMap;
import java.util.Map;
import lombok.Data;

@Data
public class Ingredient {
  @NotNull SnowstormConceptMini activeIngredient;
  SnowstormConceptMini preciseIngredient;
  SnowstormConceptMini basisOfStrengthSubstance;
  @Valid Quantity totalQuantity;
  @Valid Quantity concentrationStrength;

  @JsonIgnore
  public Map<String, String> getIdFsnMap() {
    Map<String, String> idMap = new HashMap<>();
    idMap.put(activeIngredient.getConceptId(), SnowstormDtoUtil.getFsnTerm(activeIngredient));
    if (preciseIngredient != null) {
      idMap.put(preciseIngredient.getConceptId(), SnowstormDtoUtil.getFsnTerm(preciseIngredient));
    }
    if (basisOfStrengthSubstance != null) {
      idMap.put(
          basisOfStrengthSubstance.getConceptId(),
          SnowstormDtoUtil.getFsnTerm(basisOfStrengthSubstance));
    }
    if (totalQuantity != null) {
      idMap.putAll(totalQuantity.getIdFsnMap());
    }
    if (concentrationStrength != null) {
      idMap.putAll(concentrationStrength.getIdFsnMap());
    }
    return idMap;
  }
}
