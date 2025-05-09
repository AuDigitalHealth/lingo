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
import au.gov.digitalhealth.lingo.util.PartionIdentifier;
import au.gov.digitalhealth.lingo.validation.ValidSctId;
import jakarta.validation.ValidationException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.Data;

/**
 * Details of a "level" in the model. This controls the name and label that is used for this
 * specific level in this model, the semantic tag to use, and the reference set that concepts from
 * this level are put in.
 */
@Data
public class ModelLevel {
  @NotNull private ModelLevelType modelLevelType;
  @NotBlank private String name;
  @NotBlank private String displayLabel;
  @NotBlank private String semanticTag;

  @ValidSctId(partitionIdentifier = PartionIdentifier.CONCEPT)
  @NotNull
  private String referenceSetIdentifier;

  private String productModelEcl;

  public static ModelLevel getLeafLevel(Set<ModelLevel> levels) {
    Set<ModelLevelType> levelTypes =
        levels.stream().map(ModelLevel::getModelLevelType).collect(Collectors.toSet());

    Set<ModelLevel> leafLevel =
        levels.stream()
            .filter(
                level ->
                    level.getModelLevelType().getDescendants().isEmpty()
                        || level.getModelLevelType().getDescendants().stream()
                            .noneMatch(levelTypes::contains))
            .collect(Collectors.toSet());

    if (leafLevel.size() > 1) {
      throw new ValidationException(
          "More than one leaf level found for the given levels: " + leafLevel);
    } else if (leafLevel.isEmpty()) {
      throw new ValidationException("No leaf level found for the given levels: " + levels);
    } else {
      return leafLevel.iterator().next();
    }
  }

  public boolean isLeafLevel(Set<ModelLevel> levels) {
    return getLeafLevel(levels).equals(this);
  }
}
