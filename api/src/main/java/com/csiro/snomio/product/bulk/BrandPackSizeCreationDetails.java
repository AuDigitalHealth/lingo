package com.csiro.snomio.product.bulk;

import com.csiro.snomio.product.ProductBrands;
import com.csiro.snomio.product.ProductPackSizes;
import com.csiro.snomio.util.PartionIdentifier;
import com.csiro.snomio.validation.ValidSctId;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Valid
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BrandPackSizeCreationDetails implements BulkProductActionDetails {
  @NotNull
  @ValidSctId(partitionIdentifier = PartionIdentifier.CONCEPT)
  private String productId;

  @Valid private ProductBrands brands;

  @Valid private ProductPackSizes packSizes;

  @JsonIgnore
  public Map<String, String> getIdFsnMap() {
    Map<String, String> returnMap = brands == null ? new HashMap<>() : brands.getIdFsnMap();
    returnMap.putAll(packSizes == null ? Map.of() : packSizes.getIdFsnMap());
    return returnMap;
  }

  @Override
  public String calculateSaveName() {
    return "Brand/pack size " + new Date();
  }
}
