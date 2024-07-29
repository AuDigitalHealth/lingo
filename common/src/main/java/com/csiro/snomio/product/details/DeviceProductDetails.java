package com.csiro.snomio.product.details;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.csiro.snomio.validation.OnlyOneNotEmpty;
import java.util.Map;
import java.util.Set;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@OnlyOneNotEmpty(
    fields = {"newSpecificDeviceName", "specificDeviceType"},
    message = "Either newSpecificDeviceName or specificDeviceType must be populated, but not both")
public class DeviceProductDetails extends ProductDetails {
  String newSpecificDeviceName;

  SnowstormConceptMini specificDeviceType;

  Set<SnowstormConceptMini> otherParentConcepts;

  @Override
  protected Map<String, String> getSpecialisedIdFsnMap() {
    return specificDeviceType == null
        ? Map.of()
        : Map.of(specificDeviceType.getConceptId(), specificDeviceType.getFsn().getTerm());
  }
}
