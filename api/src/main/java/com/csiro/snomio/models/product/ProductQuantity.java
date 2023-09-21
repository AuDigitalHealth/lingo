package com.csiro.snomio.models.product;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ProductQuantity<T extends ProductDetails> extends Quantity {
  T productDetails;
}
