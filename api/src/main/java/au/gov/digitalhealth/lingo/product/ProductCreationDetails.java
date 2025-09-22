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
public class ProductCreationDetails<T extends ProductDetails>
    extends ProductCreateUpdateDetails<T> {

  public ProductCreationDetails(
      ProductSummary productSummary,
      PackageDetails<T> packageDetails,
      Long ticketIt,
      String partialSaveName,
      String nameOverride) {
    super(productSummary, packageDetails, ticketIt, partialSaveName, nameOverride);
  }

  @Override
  public ProductDto toProductDto() {
    ProductDto productDto = super.toProductDto();
    productDto.setAction(ProductAction.CREATE);
    return productDto;
  }
}
