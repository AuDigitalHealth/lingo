package com.csiro.snomio.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.csiro.snomio.util.PartionIdentifier;
import com.csiro.snomio.validation.ValidSctId;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.Data;

@Valid
@Data
public class ProductBrands implements Serializable {

  @NotNull
  @ValidSctId(partitionIdentifier = PartionIdentifier.CONCEPT)
  private String productId;

  @Valid @NotNull @NotEmpty private Set<@Valid BrandWithIdentifiers> brands;

  @JsonIgnore
  public Map<String, String> getIdFsnMap() {
    return brands.stream()
        .map(BrandWithIdentifiers::getBrand)
        .distinct()
        .filter(s -> s.getFsn() != null)
        .collect(Collectors.toMap(SnowstormConceptMini::getConceptId, s -> s.getFsn().getTerm()));
  }
}
