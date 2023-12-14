package com.csiro.ticket.controllers.dto;


import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

import com.csiro.ticket.controllers.dto.models.Product;
import com.csiro.snomio.models.product.details.PackageDetails;
import com.csiro.snomio.models.product.details.ProductDetails;
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

  public static Set<ProductDto> of(Set<Product> products) {
    if (products == null) {
      return new HashSet<>();
    }
    return products.stream().map(ProductDto::of).collect(Collectors.toSet());
  }

  public static ProductDto of(Product product) {
    ProductDtoBuilder productDto = ProductDto.builder();

    productDto
        .id(product.getId())
        .ticketId(product.getTicket().getId())
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
