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
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class Ingredient extends ProductBaseDto {
  @NotNull SnowstormConceptMini activeIngredient;
  SnowstormConceptMini refinedActiveIngredient;
  SnowstormConceptMini preciseIngredient;
  SnowstormConceptMini basisOfStrengthSubstance;
  @Valid Quantity totalQuantity;
  @Valid Quantity concentrationStrength;
  @Valid Quantity presentationStrengthNumerator;
  @Valid Quantity presentationStrengthDenominator;
  @Valid Quantity concentrationStrengthNumerator;
  @Valid Quantity concentrationStrengthDenominator;

  @JsonIgnore
  public Map<String, String> getIdFsnMap() {
    Map<String, String> idMap = addToIdFsnMap(null, totalQuantity, concentrationStrength);
    if (activeIngredient != null) {
      addToIdFsnMap(idMap, activeIngredient);
    }
    if (preciseIngredient != null) {
      addToIdFsnMap(idMap, preciseIngredient);
    }
    if (basisOfStrengthSubstance != null) {
      addToIdFsnMap(idMap, basisOfStrengthSubstance);
    }
    return idMap;
  }

  @JsonIgnore
  public Map<String, String> getIdPtMap() {
    Map<String, String> idMap = addToIdPtMap(null, totalQuantity, concentrationStrength);
    addToIdPtMap(idMap, activeIngredient);
    if (preciseIngredient != null) {
      addToIdPtMap(idMap, preciseIngredient);
    }
    if (basisOfStrengthSubstance != null) {
      addToIdPtMap(idMap, basisOfStrengthSubstance);
    }
    return idMap;
  }

  @JsonIgnore
  public boolean isIngredientPresentationStrength() {
    return presentationStrengthNumerator != null && presentationStrengthDenominator != null;
  }

  @JsonIgnore
  public boolean isIngredientConcentrationStrength() {
    return concentrationStrengthNumerator != null && concentrationStrengthDenominator != null;
  }
}
