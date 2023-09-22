package com.csiro.snomio.models.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Edge in a {@link ProductSummary} which represents a relationship between two concepts within a
 * product's model, with a label indicating the type of the relationship.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Edge {

  String source;
  String target;
  String label;
}
