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
package au.gov.digitalhealth.tickets.controllers;

import au.gov.digitalhealth.lingo.product.ProductBrands;
import au.gov.digitalhealth.lingo.product.ProductPackSizes;
import au.gov.digitalhealth.lingo.product.bulk.BrandPackSizeCreationDetails;
import au.gov.digitalhealth.lingo.product.bulk.BulkProductActionDetails;
import au.gov.digitalhealth.tickets.BaseAuditableDto;
import au.gov.digitalhealth.tickets.models.BulkProductAction;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;
import lombok.experimental.SuperBuilder;

/** DTO for {@link BulkProductAction} */
@Data
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@Accessors(chain = true)
public class BulkProductActionDto extends BaseAuditableDto implements Serializable {
  private Long ticketId;
  @NotNull @NotEmpty private String name;
  private Set<String> conceptIds;
  @NotNull private BulkProductActionDetails details;

  @JsonIgnore
  public ProductBrands getBrands() {
    if (details instanceof BrandPackSizeCreationDetails brandPackSizeCreationDetails) {
      return brandPackSizeCreationDetails.getBrands();
    } else {
      return null; // Handle other types or return an empty set as per your requirement
    }
  }

  @JsonIgnore
  public ProductPackSizes getPackSizes() {
    if (details instanceof BrandPackSizeCreationDetails brandPackSizeCreationDetails) {
      return brandPackSizeCreationDetails.getPackSizes();
    } else {
      return null; // Handle other types or return an empty set as per your requirement
    }
  }
}
