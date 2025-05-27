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
package au.gov.digitalhealth.lingo.product.details.properties;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.NonDefiningPropertyDataType;
import au.gov.digitalhealth.lingo.validation.OnlyOneNotEmpty;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@OnlyOneNotEmpty(fields = {"value", "valueObject"})
public class NonDefiningProperty extends NonDefiningBase implements Serializable {
  String value;
  SnowstormConceptMini valueObject;

  public NonDefiningProperty(
      SnowstormRelationship r,
      @NotNull
          au.gov.digitalhealth.lingo.configuration.model.NonDefiningProperty nonDefiningProperty) {
    this.setIdentifierScheme(nonDefiningProperty.getName());
    this.setIdentifier(nonDefiningProperty.getIdentifier());
    this.setTitle(nonDefiningProperty.getTitle());
    this.setDescription(nonDefiningProperty.getDescription());
    if (!r.getTypeId().equals(nonDefiningProperty.getIdentifier())) {
      throw new IllegalArgumentException(
          "The relationship type "
              + r.getTypeId()
              + " does not match the identifier of the non-defining property "
              + nonDefiningProperty.getIdentifier());
    }
    if (nonDefiningProperty.getDataType().equals(NonDefiningPropertyDataType.CONCEPT)) {
      valueObject = r.getTarget();
    } else {
      value = r.getConcreteValue().getValue();
    }
  }
}
