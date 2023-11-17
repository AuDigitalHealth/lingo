package com.csiro.snomio.models.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
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

  public Map<String, String> getIdFsnMap() {
    Map<String, String> idMap = new HashMap<>();
    idMap.put(activeIngredient.getConceptId(), activeIngredient.getFsn().getTerm());
    if (preciseIngredient != null) {
      idMap.put(preciseIngredient.getConceptId(), preciseIngredient.getFsn().getTerm());
    }
    if (basisOfStrengthSubstance != null) {
      idMap.put(
          basisOfStrengthSubstance.getConceptId(), basisOfStrengthSubstance.getFsn().getTerm());
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
