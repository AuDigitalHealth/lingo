package com.csiro.snomio.models.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMiniComponent;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class DeviceProductDetails extends ProductDetails {
  SnowstormConceptMiniComponent specificDeviceType;
}
