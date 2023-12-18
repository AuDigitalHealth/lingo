package com.csiro.tickets.controllers.dto;

import com.csiro.tickets.*;
import java.util.Set;
import lombok.*;
import lombok.experimental.SuperBuilder;

@SuperBuilder
public class TicketDto extends TicketMinimalDto {
  @Getter private Set<ProductDto> products;
}
