package au.gov.digitalhealth.lingo.product.details.properties;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public abstract class NonDefiningBase {
  @NotNull @NotEmpty String identifierScheme;
}
