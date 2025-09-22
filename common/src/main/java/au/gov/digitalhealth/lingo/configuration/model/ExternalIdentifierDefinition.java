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
package au.gov.digitalhealth.lingo.configuration.model;

import static au.gov.digitalhealth.lingo.product.details.properties.PropertyType.EXTERNAL_IDENTIFIER;

import au.gov.digitalhealth.lingo.configuration.model.enumeration.MappingType;
import au.gov.digitalhealth.lingo.product.details.properties.PropertyType;
import au.gov.digitalhealth.lingo.validation.ValidDefaultMappingType;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import lombok.Data;
import lombok.EqualsAndHashCode;

/** Configuration for a non-defining property implemented as a mapping type reference set. */
@EqualsAndHashCode(callSuper = true)
@Data
@ValidDefaultMappingType
public class ExternalIdentifierDefinition extends BasePropertyWithValueDefinition {

  /** Default mapping type. */
  private MappingType defaultMappingType;

  /** Allowed mapping types. */
  private Set<MappingType> mappingTypes;

  /** CodeSystem URI for the value */
  private String codeSystem;

  /**
   * Additional fields that can be used to store extra information about the external identifier.
   * These fields are added on to the reference set member as additional fields and must match the
   * reference set descriptor.
   */
  private Map<String, AdditionalFieldDefinition> additionalFields = new HashMap<>();

  public PropertyType getPropertyType() {
    return EXTERNAL_IDENTIFIER;
  }
}
