package com.csiro.snomio.product.bulk;

import com.csiro.snomio.product.ProductSummary;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Valid
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkProductAction<T extends BulkProductActionDetails> {
  /** Summary of the product concepts that exist and to create */
  @NotNull @Valid ProductSummary productSummary;

  /** Data used to calculate the product summary */
  @NotNull @Valid T details;

  /** Ticket to record this against */
  @NotNull Long ticketId;

  /**
   * The name of a previous partial save of the details loaded and completed to create this product
   * - will be overwritten with the creation product details.
   */
  String partialSaveName;

  public String calculateSaveName() {
    return details.calculateSaveName();
  }
}
