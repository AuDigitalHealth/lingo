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
package au.gov.digitalhealth.lingo.util;

import static au.gov.digitalhealth.lingo.util.HistoricalAssociationReferenceSet.POSSIBLY_EQUIVALENT_TO;
import static au.gov.digitalhealth.lingo.util.HistoricalAssociationReferenceSet.REPLACED_BY;
import static au.gov.digitalhealth.lingo.util.HistoricalAssociationReferenceSet.SAME_AS;

import lombok.Getter;

public enum InactivationReason implements LingoConstants {
  AMBIGUOUS("900000000000484002", "Ambiguous", POSSIBLY_EQUIVALENT_TO),
  DUPLICATE("900000000000482003", "Duplicate", SAME_AS),
  ERRONEOUS("900000000000485001", "Erroneous", REPLACED_BY),
  OUTDATED("900000000000483008", "Outdated", REPLACED_BY);

  private final String value;
  private final String label;
  @Getter private final HistoricalAssociationReferenceSet historicalAssociationReferenceSet;

  InactivationReason(
      String value,
      String label,
      HistoricalAssociationReferenceSet historicalAssociationReferenceSet) {
    this.value = value;
    this.label = label;
    this.historicalAssociationReferenceSet = historicalAssociationReferenceSet;
  }

  @Override
  public String getValue() {
    return value;
  }

  @Override
  public String toString() {
    return getValue();
  }

  @Override
  public String getLabel() {
    return label;
  }

  @Override
  public boolean hasLabel() {
    return this.label != null;
  }
}
