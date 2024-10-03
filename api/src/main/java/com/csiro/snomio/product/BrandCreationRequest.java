package com.csiro.snomio.product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class BrandCreationRequest implements Serializable {
  @NotNull @Valid String brandName;

  @NotNull Long ticketId;
}
