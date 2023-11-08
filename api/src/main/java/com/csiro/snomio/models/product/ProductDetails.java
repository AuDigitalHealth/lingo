package com.csiro.snomio.models.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProductDetails {
  @NotNull SnowstormConceptMini productName;
  SnowstormConceptMini deviceType;
  String otherIdentifyingInformation;
}
