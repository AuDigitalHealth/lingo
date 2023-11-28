package com.csiro.snomio.models.product;

import com.csiro.snomio.models.product.details.PackageDetails;
import com.csiro.snomio.models.product.details.ProductDetails;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Data class for product creation request
 *
 * @param <T> product details type either #MedicationProductDetails or #DeviceProductDetails
 */
@Data
public class ProductCreationDetails<T extends ProductDetails> {
  /** Summary of the product concepts that exist and to create */
  @NotNull @Valid ProductSummary productSummary;

  /** Atomic data used to calculate the product summary */
  @NotNull @Valid PackageDetails<T> packageDetails;

  /** Ticket to record this against */
  @NotNull Long ticketId;
}
