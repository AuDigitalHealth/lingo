package com.csiro.snomio.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.csiro.snomio.product.details.ExternalIdentifier;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.Set;
import lombok.Data;

@Data
public class BrandWithIdentifiers {
  @NotNull private SnowstormConceptMini brand;
  @NotNull @Valid private Set<@Valid ExternalIdentifier> externalIdentifiers;
}
