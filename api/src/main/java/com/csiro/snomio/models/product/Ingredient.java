package com.csiro.snomio.models.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMiniComponent;
import lombok.Data;

@Data
public class Ingredient {
  SnowstormConceptMiniComponent activeIngredient;
  SnowstormConceptMiniComponent preciseIngredient;
  SnowstormConceptMiniComponent basisOfStrengthSubstance;
  Quantity totalQuantity;
  Quantity concentrationStrength;
}
