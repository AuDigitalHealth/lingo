/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.lingo.product;

import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.ProductDetails;
import au.gov.digitalhealth.tickets.controllers.ProductDto;
import au.gov.digitalhealth.tickets.models.ProductAction;
import com.fasterxml.jackson.annotation.JsonTypeName;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Data class for product creation request
 *
 * @param <T> product details type either #MedicationProductDetails or #DeviceProductDetails
 */
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@Data
@JsonTypeName("update")
public class ProductUpdateDetails<T extends ProductDetails> extends ProductCreateUpdateDetails<T> {
  /** The productId of the product to update */
  String originalConceptId;

  /**
   * Atomic data loaded before the edit started - used for a reference of the edit starting point
   */
  @NotNull @Valid PackageDetails<T> originalPackageDetails;

  public ProductUpdateDetails(
      String originalConceptId,
      ProductSummary productSummary,
      PackageDetails<T> packageDetails,
      PackageDetails<T> originalPackageDetails,
      Long ticketId,
      String nameOverride,
      Long ticketProductId) {
    super(productSummary, packageDetails, ticketId, nameOverride, ticketProductId);
    this.originalConceptId = originalConceptId;
    this.originalPackageDetails = originalPackageDetails;
  }

  @Override
  public ProductDto toProductDto() {
    ProductDto productDto = super.toProductDto();
    productDto.setOriginalConceptId(originalConceptId);
    productDto.setOriginalPackageDetails(originalPackageDetails);
    productDto.setAction(ProductAction.UPDATE);

    return productDto;
  }
}
