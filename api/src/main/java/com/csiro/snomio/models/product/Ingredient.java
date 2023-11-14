package com.csiro.snomio.models.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class Ingredient {
  @NotNull SnowstormConceptMini activeIngredient;
  SnowstormConceptMini preciseIngredient;
  SnowstormConceptMini basisOfStrengthSubstance;
  @Valid Quantity totalQuantity;
  @Valid Quantity concentrationStrength;
}
