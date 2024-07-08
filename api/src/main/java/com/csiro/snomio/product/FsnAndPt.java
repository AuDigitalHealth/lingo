package com.csiro.snomio.product;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
@SuppressWarnings("java:S116")
public class FsnAndPt {

  String FSN;
  String PT;
}
