package com.csiro.tickets.controllers.dto;

import com.csiro.snomio.models.product.details.PackageDetails;
import com.csiro.snomio.models.product.details.ProductDetails;
import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProductDto {

  private Long id;

  private Long ticketId;

  private Integer version;

  private Instant created;

  private Instant modified;

  private String createdBy;

  private String modifiedBy;

  private String name;

  private Long conceptId;

  private PackageDetails<? extends ProductDetails> packageDetails;
}
