package com.csiro.snomio.models.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import jakarta.validation.constraints.NotNull;
import java.util.HashMap;
import java.util.Map;
import lombok.Data;

@Data
public abstract class ProductDetails {
  @NotNull SnowstormConceptMini productName;
  SnowstormConceptMini deviceType;
  String otherIdentifyingInformation;

  public Map<String, String> getIdFsnMap() {
    Map<String, String> idMap = new HashMap<>();
    idMap.put(productName.getConceptId(), productName.getFsn().getTerm());
    if (deviceType != null) {
      idMap.put(deviceType.getConceptId(), deviceType.getFsn().getTerm());
    }
    idMap.putAll(getSpecialisedIdFsnMap());
    return idMap;
  }

  protected abstract Map<String, String> getSpecialisedIdFsnMap();
}
