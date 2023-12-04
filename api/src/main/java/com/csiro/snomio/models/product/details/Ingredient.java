package com.csiro.snomio.models.product.details;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.csiro.snomio.util.SnowstormDtoUtil;
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
