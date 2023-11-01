package com.csiro.snomio.models.product;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExternalIdentifier {
  @NotNull @NotEmpty @URL String identifierScheme;
  @NotNull @NotEmpty String identifierValue;
}
