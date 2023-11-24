package com.csiro.snomio.models.product;

import com.csiro.snomio.models.product.details.PackageDetails;
import com.csiro.snomio.models.product.details.ProductDetails;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data class for product creation request
 *
 * @param <T> product details type either #MedicationProductDetails or #DeviceProductDetails
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
public class ProductCreationDetails<T extends ProductDetails> {
  /** Summary of the product concepts that exist and to create */
  @NotNull @Valid ProductSummary productSummary;

  /** Atomic data used to calculate the product summary */
  @NotNull @Valid PackageDetails<T> packageDetails;

  /** Ticket to record this against */
  @NotNull Long ticketId;
}
