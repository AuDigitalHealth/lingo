package com.csiro.snomio.models.product;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ProductQuantity<T extends ProductDetails> extends Quantity {
  @NotNull @Valid T productDetails;

  @Override
  @JsonIgnore
  public Map<String, String> getIdFsnMap() {
    Map<String, String> idMap = productDetails.getIdFsnMap();
    idMap.putAll(super.getIdFsnMap());
    return idMap;
  }
}
