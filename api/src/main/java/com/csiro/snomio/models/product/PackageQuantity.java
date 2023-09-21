package com.csiro.snomio.models.product;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class PackageQuantity<T extends ProductDetails> extends Quantity {
  PackageDetails<T> packageDetails;
}
