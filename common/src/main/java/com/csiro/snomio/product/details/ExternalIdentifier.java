package com.csiro.snomio.product.details;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExternalIdentifier implements Serializable {
  @NotNull @NotEmpty @URL String identifierScheme;
  @NotNull @NotEmpty String identifierValue;
}
