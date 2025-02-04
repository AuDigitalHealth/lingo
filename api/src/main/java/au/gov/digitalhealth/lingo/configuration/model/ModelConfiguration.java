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
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelType;
import jakarta.validation.ValidationException;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;
import org.springframework.beans.factory.InitializingBean;

/** Configuration of a specific model for a given project. */
@Data
public class ModelConfiguration implements InitializingBean {
  /** The type of model. */
  @NotNull private ModelType modelType;

  /**
   * The concept levels enabled in the model and their details. This will affect the levels expected
   * in existing content and generated in new content.
   */
  @NotEmpty private List<ModelLevel> levels;

  /** The mappings that can be used in the model for map type refsets. */
  private List<MappingRefset> mappings = new ArrayList<>();

  /**
   * The non-defining properties that can be used in the model. This encompasses relationships, and
   * concrete domains.
   */
  private List<NonDefiningProperty> nonDefiningProperties = new ArrayList<>();

  /** The additional simple reference sets that products/packages can be added into. */
  private List<ReferenceSet> referenceSets = new ArrayList<>();

  @Override
  public void afterPropertiesSet() throws ValidationException {
    validateModelLevels();
    validateProperties(nonDefiningProperties);
    validateProperties(mappings);
    validateProperties(referenceSets);
  }

  private void validateModelLevels() throws ValidationException {
    List<String> levelNames = new ArrayList<>();
    List<ModelLevelType> levelTypes = new ArrayList<>();
    List<String> refsetIds = new ArrayList<>();
    List<String> displayLabels = new ArrayList<>();
    for (ModelLevel level : levels) {
      validateUnique(
          level.getName(),
          levelNames,
          "Model level names must be unique within a model duplicate name: ");
      validateUnique(
          level.getModelLevelType(),
          levelTypes,
          "Model level types must be unique within a model duplicate type: ");
      validateUnique(
          level.getReferenceSetIdentifier(),
          refsetIds,
          "Model level refset ids must be unique within a model duplicate type: ");
      validateUnique(
          level.getDisplayLabel(),
          displayLabels,
          "Model level display labels must be unique within a model duplicate type: ");
    }
  }

  private void validateProperties(List<? extends NonDefiningBase> properties)
      throws ValidationException {
    List<String> propertyNames = new ArrayList<>();
    List<String> propertyRefsetIds = new ArrayList<>();
    for (NonDefiningBase property : properties) {
      validateUnique(
          property.getName(),
          propertyNames,
          "Property names must be unique within a model duplicate name: ");
      if (property.getIdentifier() != null) {
        validateUnique(
            property.getIdentifier(),
            propertyRefsetIds,
            "Property ids must be unique within a model duplicate id: ");
      }
    }
  }

  private <T> void validateUnique(T value, List<T> list, String errorMessage)
      throws ValidationException {
    if (list.contains(value)) {
      throw new ValidationException(errorMessage + value);
    }
    list.add(value);
  }
}
