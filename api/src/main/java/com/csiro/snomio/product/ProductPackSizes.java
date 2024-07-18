package com.csiro.snomio.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import lombok.Data;

@Valid
@Data
public class ProductPackSizes implements Serializable {
  private String productId;

  @NotNull private SnowstormConceptMini unitOfMeasure;

  @NotEmpty @NotNull private Set<PackSizeWithIdentifiers> packSizes;

  @JsonIgnore
  public Map<String, String> getIdFsnMap() {
    return Map.of(
        Objects.requireNonNull(unitOfMeasure.getConceptId()),
        Objects.requireNonNull(Objects.requireNonNull(unitOfMeasure.getFsn()).getTerm()));
  }
}
