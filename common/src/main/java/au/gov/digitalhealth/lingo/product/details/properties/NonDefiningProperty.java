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
import au.gov.digitalhealth.lingo.configuration.model.NonDefiningPropertyDefinition;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.NonDefiningPropertyDataType;
import au.gov.digitalhealth.lingo.validation.OnlyOneNotEmpty;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonTypeName;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.Collection;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonTypeName("nonDefiningProperty")
@OnlyOneNotEmpty(fields = {"value", "valueObject"})
public class NonDefiningProperty extends NonDefiningBase implements Serializable {
  String value;
  SnowstormConceptMini valueObject;

  public NonDefiningProperty() {
    this.setType(PropertyType.NON_DEFINING_PROPERTY);
  }

  public NonDefiningProperty(
      SnowstormRelationship r,
      @NotNull NonDefiningPropertyDefinition nonDefiningPropertyDefinition) {
    this.setIdentifierScheme(nonDefiningPropertyDefinition.getName());
    this.setIdentifier(nonDefiningPropertyDefinition.getIdentifier());
    this.setTitle(nonDefiningPropertyDefinition.getTitle());
    this.setDescription(nonDefiningPropertyDefinition.getDescription());
    if (!r.getTypeId().equals(nonDefiningPropertyDefinition.getIdentifier())) {
      throw new IllegalArgumentException(
          "The relationship type "
              + r.getTypeId()
              + " does not match the identifier of the non-defining property "
              + nonDefiningPropertyDefinition.getIdentifier());
    }
    if (nonDefiningPropertyDefinition.getDataType().equals(NonDefiningPropertyDataType.CONCEPT)) {
      valueObject = r.getTarget();
    } else {
      value = r.getConcreteValue().getValue();
    }
  }

  public static Collection<NonDefiningProperty> filter(Collection<NonDefiningBase> properties) {
    return properties.stream()
        .filter(p -> p.getType().equals(PropertyType.NON_DEFINING_PROPERTY))
        .map(p -> (NonDefiningProperty) p)
        .toList();
  }
}
