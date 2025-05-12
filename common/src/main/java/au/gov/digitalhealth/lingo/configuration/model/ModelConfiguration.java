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
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType;
import au.gov.digitalhealth.lingo.exception.ConfigurationProblem;
import jakarta.validation.Valid;
import jakarta.validation.ValidationException;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.io.File;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
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

  @NotEmpty private String baseDeviceSchema;

  @NotEmpty private String baseDeviceUiSchema;

  @NotEmpty private String baseBulkBrandSchema;

  @NotEmpty private String baseBulkBrandUiSchema;

  @NotEmpty private String baseBulkPackSchema;

  @NotEmpty private String baseBulkPackUiSchema;

  @NotEmpty private String moduleId;

  private String subpackFromPackageEcl;

  @NotEmpty private String medicationPackageDataExtractionEcl;
  @NotEmpty private String medicationProductDataExtractionEcl;
  @NotEmpty private String devicePackageDataExtractionEcl;
  @NotEmpty private String deviceProductDataExtractionEcl;

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

  public Map<String, ReferenceSet> getReferenceSetForType(ProductPackageType... types) {
    return referenceSets.stream()
        .filter(mapping -> Arrays.stream(types).toList().contains(mapping.getLevel()))
        .collect(Collectors.toMap(ReferenceSet::getIdentifier, Function.identity(), (a, b) -> a));
  }

  public Map<String, MappingRefset> getMappingRefsetMapForType(ProductPackageType... types) {
    return mappings.stream()
        .filter(mapping -> Arrays.stream(types).toList().contains(mapping.getLevel()))
        .collect(Collectors.toMap(MappingRefset::getName, Function.identity(), (a, b) -> a));
  }

  public Map<String, NonDefiningProperty> getNonDefiningPropertiesByName() {
    return nonDefiningProperties.stream()
        .collect(Collectors.toMap(NonDefiningProperty::getName, Function.identity(), (a, b) -> a));
  }

  public Set<ModelLevel> getProductLevels() {
    return levels.stream()
        .filter(level -> level.getModelLevelType().isProductLevel())
        .collect(Collectors.toSet());
  }

  public Set<ModelLevel> getPackageLevels() {
    return levels.stream()
        .filter(level -> level.getModelLevelType().isPackageLevel())
        .collect(Collectors.toSet());
  }

  public ModelLevel getLevelOfType(ModelLevelType type) {
    List<ModelLevel> matchingLevels =
        levels.stream().filter(level -> level.getModelLevelType().equals(type)).toList();

    if (matchingLevels.isEmpty()) {
      throw new ValidationException(
          "No model level found for type: " + type + " in model: " + this.modelType);
    }

    if (matchingLevels.size() > 1) {
      throw new ValidationException(
          "Multiple model levels found for type: " + type + " in model: " + this.modelType);
    }

    return matchingLevels.get(0);
  }

  /**
   * Gets the most immediate parent model level for the given model level type.
   *
   * @param modelLevel The model level type to find the parent for
   * @return The parent model level, or null if there is no parent
   * @throws ValidationException if multiple parents are found, or the type exists but there is no
   *     matching level
   */
  public Set<ModelLevel> getParentModelLevels(ModelLevelType modelLevel) {
    // Get ancestors of the requested model level
    Set<ModelLevelType> ancestorTypes = modelLevel.getAncestors();

    // Get all model level types available in this model
    Set<ModelLevelType> availableTypes =
        getLevels().stream().map(ModelLevel::getModelLevelType).collect(Collectors.toSet());

    // Find ancestors that exist in our model
    Set<ModelLevelType> existingAncestors =
        ancestorTypes.stream().filter(availableTypes::contains).collect(Collectors.toSet());

    // Find the most immediate ancestors (ones that don't have their own ancestors in the set)
    Set<ModelLevelType> immediateAncestors = new HashSet<>(existingAncestors);
    existingAncestors.forEach(ancestor -> immediateAncestors.removeAll(ancestor.getAncestors()));

    // Validate the result
    if (immediateAncestors.isEmpty()) {
      return Set.of();
    }

    // Get the actual ModelLevel instance for the found type
    return getLevels().stream()
        .filter(level -> immediateAncestors.contains(level.getModelLevelType()))
        .collect(Collectors.toSet());
  }

  public boolean containsModelLevel(ModelLevelType modelLevelType) {
    return levels.stream().anyMatch(level -> level.getModelLevelType().equals(modelLevelType));
  }

  public String getReferenceSetForModelLevelType(ModelLevelType modelLevelType) {
    return levels.stream()
        .filter(level -> level.getModelLevelType().equals(modelLevelType))
        .map(ModelLevel::getReferenceSetIdentifier)
        .findFirst()
        .orElseThrow(
            () ->
                new ConfigurationProblem(
                    "No reference set found for model level type: " + modelLevelType));
  }

  public Set<String> getReferenceSetsForModelLevelTypes(ModelLevelType... modelLevelType) {
    Set<ModelLevelType> modelLevelTypes = new HashSet<>(Arrays.asList(modelLevelType));
    return levels.stream()
        .filter(level -> modelLevelTypes.contains(level.getModelLevelType()))
        .map(ModelLevel::getReferenceSetIdentifier)
        .collect(Collectors.toSet());
  }

  public ModelLevel getLeafPackageModelLevel() {
    return ModelLevel.getLeafLevel(getPackageLevels());
  }

  public ModelLevel getContainedLevelForType(ModelLevelType modelLevel) {
    if (!modelLevel.isPackageLevel()) {
      throw new ConfigurationProblem(
          "Model level type "
              + modelLevel
              + " is not a package level type, cannot get contained level");
    }

    return getLevelOfType(modelLevel.getContainedLevel());
  }
}
