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

import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelLevelType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType;
import au.gov.digitalhealth.lingo.product.details.properties.PropertyType;
import au.gov.digitalhealth.lingo.util.PartionIdentifier;
import au.gov.digitalhealth.lingo.validation.ValidSctId;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(of = "name")
public abstract class BasePropertyDefinition {

  /** The name of the property, used in generated JSON Schema. */
  @NotBlank
  @Size(min = 3, max = 20, message = "Name must be between 3 and 20 characters")
  @Pattern(regexp = "^[a-zA-Z_]\\w*$", message = "Invalid JSON element name")
  private String name;

  /** The title of the property for human rendering. */
  @NotBlank private String title;

  /** Optional description of the property for human rendering to understand the property. */
  private String description;

  /** Indicates if the property is at the product or package level. */
  @NotNull private ProductPackageType level;

  /**
   * The model levels that the property is stored on and generated at - these must match the model
   * levels defined for the model.
   */
  @NotEmpty private List<ModelLevelType> modelLevels;

  /** The ID if the property/refset where this is stored */
  @NotBlank
  @ValidSctId(partitionIdentifier = PartionIdentifier.CONCEPT)
  private String identifier;

  public abstract PropertyType getPropertyType();
}
