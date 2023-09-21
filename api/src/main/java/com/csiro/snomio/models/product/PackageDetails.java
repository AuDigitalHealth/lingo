package com.csiro.snomio.models.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMiniComponent;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class PackageDetails<T extends ProductDetails> {
  SnowstormConceptMiniComponent productName;
  SnowstormConceptMiniComponent containerType;
  List<ExternalIdentifier> externalIdentifiers = new ArrayList<>();
  List<ProductQuantity<T>> containedProducts = new ArrayList<>();
  List<PackageQuantity<T>> containedPackages = new ArrayList<>();
}
