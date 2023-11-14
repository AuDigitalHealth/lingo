package com.csiro.snomio.models.product.details;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.csiro.snomio.validation.OnlyOneNotEmpty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
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
}
