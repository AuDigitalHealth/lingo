package com.csiro.snomio.models.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class DeviceProductDetails extends ProductDetails {
  @NotNull SnowstormConceptMini specificDeviceType;
}
