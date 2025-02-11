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
package au.gov.digitalhealth.lingo.product.details;

import au.gov.digitalhealth.lingo.validation.OnlyOneNotEmpty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@OnlyOneNotEmpty(
    fields = {"containedProducts", "containedPackages"},
    message = "Either containedProducts or containedPackages must be populated, but not both")
public class ContainedPackageDetails<T extends ProductDetails> extends PackageDetails<T> {
  @NotNull @Valid Quantity packSize;

  @Override
  @JsonIgnore
  public Map<String, String> getIdFsnMap() {
    return addToIdFsnMap(super.getIdFsnMap(), packSize);
  }
}
