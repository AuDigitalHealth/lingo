package com.csiro.snomio.models.product.details;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.csiro.snomio.util.SnowstormDtoUtil;
import com.csiro.snomio.validation.OnlyOneNotEmpty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.Data;

@Data
@OnlyOneNotEmpty(
    fields = {"containedProducts", "containedPackages"},
    message = "Either containedProducts or containedPackages must be populated, but not both")
public class PackageDetails<T extends ProductDetails> {
  @NotNull SnowstormConceptMini productName;
  @NotNull SnowstormConceptMini containerType;
  List<@Valid ExternalIdentifier> externalIdentifiers = new ArrayList<>();
  List<@Valid ProductQuantity<T>> containedProducts = new ArrayList<>();
  List<@Valid PackageQuantity<T>> containedPackages = new ArrayList<>();

  @JsonIgnore
  public Map<String, String> getIdFsnMap() {
    Map<String, String> idMap = new HashMap<>();
    idMap.put(productName.getConceptId(), SnowstormDtoUtil.getFsnTerm(productName));
    idMap.put(containerType.getConceptId(), SnowstormDtoUtil.getFsnTerm(containerType));
    for (ProductQuantity<T> productQuantity : containedProducts) {
      idMap.putAll(productQuantity.getIdFsnMap());
    }
    for (PackageQuantity<T> packageQuantity : containedPackages) {
      idMap.putAll(packageQuantity.getIdFsnMap());
    }
    return idMap;
  }
}
