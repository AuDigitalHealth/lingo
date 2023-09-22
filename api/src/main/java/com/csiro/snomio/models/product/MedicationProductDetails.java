package com.csiro.snomio.models.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMiniComponent;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class MedicationProductDetails extends ProductDetails {
  SnowstormConceptMiniComponent genericForm;
  SnowstormConceptMiniComponent specificForm;

  // These are the old unit of use/presentation attributes needed until purged
  Quantity quantity;
  SnowstormConceptMiniComponent containerType;

  List<Ingredient> activeIngredients = new ArrayList<>();
}
