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
import jakarta.validation.Valid;
import jakarta.validation.ValidationException;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.io.File;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
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
  @NotEmpty private List<@Valid ModelLevel> levels;

  /** The mappings that can be used in the model for map type refsets. */
  private Set<@Valid MappingRefset> mappings = new HashSet<>();

  /**
   * The non-defining properties that can be used in the model. This encompasses relationships, and
   * concrete domains.
   */
  private Set<@Valid NonDefiningProperty> nonDefiningProperties = new HashSet<>();

  /** The additional simple reference sets that products/packages can be added into. */
  private Set<@Valid ReferenceSet> referenceSets = new HashSet<>();

  @NotEmpty private String baseMedicationSchema;

  @NotEmpty private String baseMedicationUiSchema;

//  @NotEmpty private String baseDeviceSchema;
//
//  @NotEmpty private String baseDeviceUiSchema;

  @Override
  public void afterPropertiesSet() throws ValidationException {
    validateModelLevels();
    validateProperties(nonDefiningProperties);
    validateProperties(mappings);
    validateProperties(referenceSets);
    validateSchemas(baseMedicationSchema, baseMedicationUiSchema);
  }

  private void validateSchemas(String... schemas) throws ValidationException {
    for (String schema : schemas) {
      if (!Files.exists(new File(schema).toPath())) {
        throw new ValidationException("Schema file for model does not exist: " + schema);
      }
    }
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

  private void validateProperties(Set<? extends NonDefiningBase> properties)
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
