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
import au.gov.digitalhealth.lingo.util.PartitionIdentifier;
import au.gov.digitalhealth.lingo.validation.ValidSctId;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
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

  /**
   * The model level that the property is stored at and cascades down from - it cannot cascade down
   * from above this level
   */
  @NotNull private ModelLevelType sourceModelLevel;

  /** The ID if the property/refset where this is stored */
  @NotBlank
  @ValidSctId(partitionIdentifier = PartitionIdentifier.CONCEPT)
  private String identifier;

  /**
   * This is used to order the properties in the UI, lower numbers appear first. If two fields have
   * the same order then their name will be used to sort them.
   */
  private int order;

  /** If the property is read only it will not be displayed in the UI for editing. */
  private boolean readOnly;

  private Set<ProductType> suppressOnProductTypes = new HashSet<>();

  public abstract PropertyType getPropertyType();

  @AssertTrue(message = "Source model level must be one of the specified model levels")
  private boolean isSourceModelLevelValid() {
    if (sourceModelLevel == null || modelLevels == null) {
      return true; // Let other validators handle null cases
    }
    return modelLevels.contains(sourceModelLevel);
  }
}
