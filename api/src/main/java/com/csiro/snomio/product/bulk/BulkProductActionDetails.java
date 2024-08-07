package com.csiro.snomio.product.bulk;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import java.io.Serializable;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
  @JsonSubTypes.Type(value = BrandPackSizeCreationDetails.class, name = "brand-pack-size")
})
public interface BulkProductActionDetails extends Serializable {

  String calculateSaveName();
}
