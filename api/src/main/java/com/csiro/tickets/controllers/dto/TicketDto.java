package com.csiro.tickets.controllers.dto;

import com.csiro.tickets.*;
import java.util.Set;
import lombok.*;
import lombok.experimental.SuperBuilder;

@SuperBuilder
@Data
public class TicketDto extends TicketMinimalDto {
  private Set<ProductDto> products;
}
