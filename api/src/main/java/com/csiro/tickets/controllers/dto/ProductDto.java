package com.csiro.tickets.controllers.dto;

import com.csiro.snomio.models.product.details.PackageDetails;
import com.csiro.tickets.models.Product;
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

  private PackageDetails packageDetails;

  public static ProductDto of(Product product) {
    ProductDtoBuilder productDto = ProductDto.builder();

    productDto
        .id(product.getId())
        .name(product.getName())
        .version(product.getVersion())
        .created(product.getCreated())
        .modified(product.getModified())
        .createdBy(product.getCreatedBy())
        .modifiedBy(product.getModifiedBy())
        .conceptId(product.getConceptId())
        .packageDetails(product.getPackageDetails());

    return productDto.build();
  }
}
