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
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import au.gov.digitalhealth.lingo.validation.OnlyOneNotEmpty;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonTypeName;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.Collection;
import lombok.Data;
import lombok.extern.java.Log;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonTypeName("nonDefiningProperty")
@OnlyOneNotEmpty(fields = {"value", "valueObject"})
@Log
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

  /**
   * This method updates the NonDefiningProperty instance with values from the definition, this is
   * because content from the UI may be partially filled in or unreliable.
   *
   * @param nonDefiningPropertyDefinition
   */
  public void updateFromDefinition(NonDefiningPropertyDefinition nonDefiningPropertyDefinition) {
    this.setIdentifierScheme(nonDefiningPropertyDefinition.getName());
    this.setIdentifier(nonDefiningPropertyDefinition.getIdentifier());
    this.setTitle(nonDefiningPropertyDefinition.getTitle());
    this.setDescription(nonDefiningPropertyDefinition.getDescription());
    if (nonDefiningPropertyDefinition.getDataType().equals(NonDefiningPropertyDataType.CONCEPT)) {
      if (this.valueObject == null) {
        throw new IllegalArgumentException(
            "Cannot have NonDefiningProperty with null valueObject for a CONCEPT data type. Value was: "
                + this.value);
      }
      if (this.value != null) {
        log.warning(
            "Cannot have NonDefiningProperty with both value and valueObject for a CONCEPT data type. Value was: "
                + this.value
                + " being set to null.");
        this.value = null;
      }
    } else {
      if (this.value == null) {
        throw new IllegalArgumentException(
            "Cannot have NonDefiningProperty with null value for a CONCEPT data type. ValueObject was: "
                + this.valueObject);
      }
      if (this.valueObject != null) {
        log.warning(
            "Cannot have NonDefiningProperty with both value and valueObject for a CONCEPT data type. ValueObject was: "
                + this.valueObject
                + " being set to null.");
        this.valueObject = null;
      }
    }
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;

    NonDefiningProperty that = (NonDefiningProperty) o;

    return new EqualsBuilder()
        .append(getIdentifierScheme(), that.getIdentifierScheme())
        .append(value, that.value)
        .append(
            valueObject != null ? valueObject.getConceptId() : null,
            that.valueObject != null ? that.valueObject.getConceptId() : null)
        .isEquals();
  }

  @Override
  public int hashCode() {
    return new HashCodeBuilder(17, 37)
        .append(getIdentifierScheme())
        .append(value)
        .append(valueObject != null ? valueObject.getConceptId() : null)
        .toHashCode();
  }

  @Override
  public String toDisplay() {
    String valueString = null;
    if (value != null) {
      valueString = value;
    } else if (valueObject != null) {
      valueString = SnowstormDtoUtil.getIdAndFsnTerm(getValueObject());
    }
    return getTitle() + ": " + valueString;
  }
}
