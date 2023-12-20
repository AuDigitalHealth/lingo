package com.csiro.tickets.models.mappers;

import com.csiro.tickets.controllers.dto.ProductDto;
import com.csiro.tickets.controllers.dto.ProductDto.ProductDtoBuilder;
import com.csiro.tickets.models.Product;
import com.csiro.tickets.models.Ticket;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

public class ProductMapper {

  private ProductMapper() {
    throw new AssertionError("This class cannot be instantiated");
  }

  public static Set<ProductDto> mapToDto(Set<Product> products) {
    if (products == null) {
      return new HashSet<>();
    }
    return products.stream().map(ProductMapper::mapToDto).collect(Collectors.toSet());
  }

  public static ProductDto mapToDto(Product product) {
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

  public static Product mapToEntity(ProductDto productDto, Ticket ticket) {
    if (productDto == null) return null;

    Product product = new Product();

    product.setTicket(ticket);
    product.setName(productDto.getName());
    product.setVersion(productDto.getVersion());
    product.setCreated(productDto.getCreated());
    product.setModified(productDto.getModified());
    product.setCreatedBy(productDto.getCreatedBy());
    product.setModifiedBy(productDto.getModifiedBy());
    product.setConceptId(productDto.getConceptId());
    product.setPackageDetails(productDto.getPackageDetails());

    return product;
  }
}
