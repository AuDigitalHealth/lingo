package com.csiro.snomio.models.product.details;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.csiro.snomio.util.SnowstormDtoUtil;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonSubTypes.Type;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.validation.constraints.NotNull;
import java.util.HashMap;
import java.util.Map;
import lombok.Data;

@Data
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
  @Type(value = MedicationProductDetails.class, name = "medication"),
  @Type(value = DeviceProductDetails.class, name = "device")
})
public abstract class ProductDetails {
  @NotNull SnowstormConceptMini productName;
  SnowstormConceptMini deviceType;
  String otherIdentifyingInformation;

  @JsonIgnore
  public Map<String, String> getIdFsnMap() {
    Map<String, String> idMap = new HashMap<>();
    idMap.put(productName.getConceptId(), SnowstormDtoUtil.getFsnTerm(productName));
    if (deviceType != null) {
      idMap.put(deviceType.getConceptId(), SnowstormDtoUtil.getFsnTerm(deviceType));
    }
    idMap.putAll(getSpecialisedIdFsnMap());
    return idMap;
  }

  protected abstract Map<String, String> getSpecialisedIdFsnMap();
}
