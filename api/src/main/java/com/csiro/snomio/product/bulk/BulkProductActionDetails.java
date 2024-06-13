package com.csiro.snomio.product.bulk;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
  @JsonSubTypes.Type(value = BrandPackSizeCreationDetails.class, name = "brand-pack-size")
})
public interface BulkProductActionDetails {

  String calculateSaveName();
}
