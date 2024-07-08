package com.csiro.tickets.controllers;

import com.csiro.snomio.product.ProductBrands;
import com.csiro.snomio.product.ProductPackSizes;
import com.csiro.snomio.product.bulk.BrandPackSizeCreationDetails;
import com.csiro.snomio.product.bulk.BulkProductActionDetails;
import com.csiro.tickets.BaseAuditableDto;
import com.csiro.tickets.TicketDto;
import com.csiro.tickets.models.BulkProductAction;
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
  private TicketDto ticket;
  @NotNull @NotEmpty private String name;
  private Set<Long> conceptIds;
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
