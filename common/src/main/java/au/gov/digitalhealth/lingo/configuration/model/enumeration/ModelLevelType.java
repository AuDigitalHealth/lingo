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

import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public enum ModelLevelType {
  MEDICINAL_PRODUCT(null),
  MEDICINAL_PRODUCT_ONLY(MEDICINAL_PRODUCT),
  MEDICINAL_PRODUCT_PRECISELY(MEDICINAL_PRODUCT_ONLY),
  MEDICINAL_PRODUCT_FORM(MEDICINAL_PRODUCT),
  MEDICINAL_PRODUCT_ONLY_FORM(MEDICINAL_PRODUCT_FORM),
  PRODUCT_NAME(null),
  REAL_MEDICINAL_PRODUCT(MEDICINAL_PRODUCT),
  CLINICAL_DRUG(MEDICINAL_PRODUCT_ONLY_FORM),
  REAL_CLINICAL_DRUG(CLINICAL_DRUG),
  PACKAGED_CLINICAL_DRUG(null),
  REAL_PACKAGED_CLINICAL_DRUG(PACKAGED_CLINICAL_DRUG),
  REAL_CONTAINERIZED_PACKAGED_CLINICAL_DRUG(REAL_PACKAGED_CLINICAL_DRUG);

  private final ModelLevelType parent;

  ModelLevelType(ModelLevelType parent) {
    this.parent = parent;
  }

  public boolean isPackageLevel() {
    return this == PACKAGED_CLINICAL_DRUG
        || this == REAL_PACKAGED_CLINICAL_DRUG
        || this == REAL_CONTAINERIZED_PACKAGED_CLINICAL_DRUG;
  }

  public Set<ModelLevelType> getAncestors() {
    return Stream.iterate(this.parent, Objects::nonNull, model -> model.parent)
        .collect(Collectors.toSet());
  }
}
