package com.csiro.tickets.controllers.dto;

import com.csiro.snomio.product.ProductBrands;
import com.csiro.snomio.product.ProductPackSizes;
import com.csiro.snomio.product.bulk.BrandPackSizeCreationDetails;
import com.csiro.snomio.product.bulk.BulkProductActionDetails;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.Instant;
import java.util.Set;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BulkProductActionDto {

  private Long id;

  private Long ticketId;

  private Integer version;

  private Instant created;

  private Instant modified;

  private String createdBy;

  private String modifiedBy;

  private String name;

  private Set<String> conceptIds;

  private BulkProductActionDetails details;

  @JsonIgnore
  public ProductBrands getBrands() {
    if (details instanceof BrandPackSizeCreationDetails) {
      return ((BrandPackSizeCreationDetails) details).getBrands();
    } else {
      return null; // Handle other types or return an empty set as per your requirement
    }
  }

  @JsonIgnore
  public ProductPackSizes getPackSizes() {
    if (details instanceof BrandPackSizeCreationDetails) {
      return ((BrandPackSizeCreationDetails) details).getPackSizes();
    } else {
      return null; // Handle other types or return an empty set as per your requirement
    }
  }
}
