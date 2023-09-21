package com.csiro.snomio.models.product;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExternalIdentifier {
  String identifierScheme;
  String identifierValue;
}
