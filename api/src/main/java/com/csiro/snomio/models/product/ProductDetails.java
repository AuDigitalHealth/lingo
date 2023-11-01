package com.csiro.snomio.models.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMiniComponent;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProductDetails {
  @NotNull SnowstormConceptMiniComponent productName;
  SnowstormConceptMiniComponent deviceType;
  String otherIdentifyingInformation;
}
