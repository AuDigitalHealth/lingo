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
package au.gov.digitalhealth.lingo.configuration.model.enumeration;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.Getter;

@Getter
public enum ModelLevelType {
  MEDICINAL_PRODUCT(null, false, null),
  MEDICINAL_PRODUCT_ONLY(Set.of(MEDICINAL_PRODUCT), false, null),
  PRODUCT_NAME(null, true, null),
  REAL_MEDICINAL_PRODUCT(Set.of(MEDICINAL_PRODUCT), true, null),
  CLINICAL_DRUG(Set.of(MEDICINAL_PRODUCT_ONLY), false, null),
  REAL_CLINICAL_DRUG(Set.of(CLINICAL_DRUG, REAL_MEDICINAL_PRODUCT), true, null),
  PACKAGED_CLINICAL_DRUG(null, false, CLINICAL_DRUG),
  REAL_PACKAGED_CLINICAL_DRUG(Set.of(PACKAGED_CLINICAL_DRUG), true, REAL_CLINICAL_DRUG),
  REAL_CONTAINERIZED_PACKAGED_CLINICAL_DRUG(
      Set.of(REAL_PACKAGED_CLINICAL_DRUG), true, REAL_CLINICAL_DRUG);

  private final Set<ModelLevelType> parents;
  private final boolean branded;
  private final ModelLevelType containedLevel;

  ModelLevelType(Set<ModelLevelType> parent, boolean branded, ModelLevelType containedLevel) {
    this.parents = parent;
    this.branded = branded;
    this.containedLevel = containedLevel;
  }

  public boolean isPackageLevel() {
    return this == PACKAGED_CLINICAL_DRUG
        || this == REAL_PACKAGED_CLINICAL_DRUG
        || this == REAL_CONTAINERIZED_PACKAGED_CLINICAL_DRUG;
  }

  public boolean isProductLevel() {
    return !isPackageLevel() && this != PRODUCT_NAME;
  }

  public Set<ModelLevelType> getAncestors() {
    Set<ModelLevelType> ancestors = new HashSet<>();
    if (parents != null) {
      for (ModelLevelType parent : parents) {
        ancestors.add(parent);
        ancestors.addAll(parent.getAncestors());
      }
    }
    return ancestors;
  }

  public Set<ModelLevelType> getDescendants() {
    return Stream.of(ModelLevelType.values())
        .filter(modelType -> modelType.getAncestors().contains(this))
        .collect(Collectors.toSet());
  }

  public boolean isContainerized() {
    return this == REAL_CONTAINERIZED_PACKAGED_CLINICAL_DRUG;
  }
}
