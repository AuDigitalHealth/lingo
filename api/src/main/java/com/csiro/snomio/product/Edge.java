package com.csiro.snomio.product;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
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
  @NotNull @NotEmpty String source;
  @NotNull @NotEmpty String target;
  @NotNull @NotEmpty String label;
}
