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
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({
  @JsonSubTypes.Type(value = ProductCreationDetails.class, name = "create"),
  @JsonSubTypes.Type(value = ProductUpdateDetails.class, name = "update")
})
@AllArgsConstructor
@NoArgsConstructor
@Data
public abstract class ProductCreateUpdateDetails<T extends ProductDetails> {
  /** Summary of the product concepts that exist and to create/update */
  @NotNull @Valid ProductSummary productSummary;

  /** Atomic data used to calculate the product summary */
  @NotNull @Valid PackageDetails<T> packageDetails;

  /** Ticket to record this against */
  @NotNull Long ticketId;

  /**
   * A name to override the name on the saved product, used in situations where two products on an
   * authored ticket MAY have the same name, but the intention is not to override the already saved
   * product, as the name + ticketId is meant to be unique
   */
  String nameOverride;

  Long ticketProductId;

  public ProductDto toProductDto() {
    return ProductDto.builder()
        .conceptId(productSummary.getSingleSubject().getConceptId())
        .packageDetails(packageDetails)
        .name(
            getNameOverride() != null
                ? getNameOverride()
                : productSummary.getSingleSubject().getFullySpecifiedName())
        .build();
  }
}
