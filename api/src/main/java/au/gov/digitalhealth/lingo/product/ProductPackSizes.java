/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.lingo.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import lombok.Data;

@Valid
@Data
public class ProductPackSizes implements Serializable {
  private String productId;

  @NotNull private SnowstormConceptMini unitOfMeasure;

  @NotEmpty @NotNull private Set<PackSizeWithIdentifiers> packSizes;

  @JsonIgnore
  public Map<String, String> getIdFsnMap() {
    return Map.of(
        Objects.requireNonNull(unitOfMeasure.getConceptId()),
        Objects.requireNonNull(Objects.requireNonNull(unitOfMeasure.getFsn()).getTerm()));
  }
}
