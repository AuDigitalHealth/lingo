package com.csiro.snomio.product;

import com.csiro.snomio.product.details.ExternalIdentifier;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.Set;
import lombok.Data;

@Data
public class PackSizeWithIdentifiers {
  @NotNull private BigDecimal packSize;
  @NotNull @Valid private Set<@Valid ExternalIdentifier> externalIdentifiers;
}
