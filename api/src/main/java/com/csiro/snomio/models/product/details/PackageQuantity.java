package com.csiro.snomio.models.product.details;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class PackageQuantity<T extends ProductDetails> extends Quantity {
  @NotNull @Valid PackageDetails<T> packageDetails;
}
