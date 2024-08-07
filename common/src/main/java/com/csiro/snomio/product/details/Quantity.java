package com.csiro.snomio.product.details;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.csiro.snomio.util.SnowstormDtoUtil;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Quantity {
  @NotNull @Positive BigDecimal value;

  @NotNull SnowstormConceptMini unit;

  @JsonIgnore
  public Map<String, String> getIdFsnMap() {
    return Map.of(unit.getConceptId(), SnowstormDtoUtil.getFsnTerm(unit));
  }
}
