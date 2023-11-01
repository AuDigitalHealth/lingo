package com.csiro.snomio.models.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMiniComponent;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class Ingredient {
  @NotNull SnowstormConceptMiniComponent activeIngredient;
  SnowstormConceptMiniComponent preciseIngredient;
  SnowstormConceptMiniComponent basisOfStrengthSubstance;
  @Valid Quantity totalQuantity;
  @Valid Quantity concentrationStrength;
}
