package com.csiro.snomio.models.product;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class PackageQuantity<T extends ProductDetails> extends Quantity {
  @NotNull @Valid PackageDetails<T> packageDetails;

  @Override
  @JsonIgnore
  public Map<String, String> getIdFsnMap() {
    Map<String, String> idMap = packageDetails.getIdFsnMap();
    idMap.putAll(super.getIdFsnMap());
    return idMap;
  }
}
