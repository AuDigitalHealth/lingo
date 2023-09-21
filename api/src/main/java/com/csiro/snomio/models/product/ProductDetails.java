package com.csiro.snomio.models.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMiniComponent;
import lombok.Data;

@Data
public class ProductDetails {
  SnowstormConceptMiniComponent productName;
  SnowstormConceptMiniComponent deviceType;
  String otherIdentifyingInformation;
}
