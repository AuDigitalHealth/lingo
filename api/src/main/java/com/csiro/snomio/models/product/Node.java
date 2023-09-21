package com.csiro.snomio.models.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMiniComponent;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A node in a {@link ProductSummary} which represents a concept with a particular label indicating
 * the type of the node in the context of the product.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Node {

  SnowstormConceptMiniComponent concept;
  String label;
}
