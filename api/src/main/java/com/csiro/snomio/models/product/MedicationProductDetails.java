package com.csiro.snomio.models.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.csiro.snomio.validation.OnlyOnePopulated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@OnlyOnePopulated(
    fields = {"containerType", "deviceType"},
    message = "Only container type or device type can be populated, not both")
public class MedicationProductDetails extends ProductDetails {
  @NotNull SnowstormConceptMini genericForm;
  SnowstormConceptMini specificForm;

  // These are the old unit of use/presentation attributes needed until purged
  @Valid Quantity quantity;
  SnowstormConceptMini containerType;

  List<@Valid Ingredient> activeIngredients = new ArrayList<>();
}
