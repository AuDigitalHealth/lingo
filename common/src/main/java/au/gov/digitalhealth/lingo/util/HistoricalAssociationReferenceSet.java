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

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

public enum HistoricalAssociationReferenceSet implements LingoConstants {
  ALTERNATIVE("900000000000530003", "ALTERNATIVE association reference set"),
  MOVED_FROM("900000000000525002", "MOVED FROM association reference set"),
  MOVED_TO("900000000000524003", "MOVED TO association reference set"),
  PARTIALLY_EQUIVALENT_TO("1186924009", "PARTIALLY EQUIVALENT TO association reference set"),
  POSSIBLY_EQUIVALENT_TO("900000000000523009", "POSSIBLY EQUIVALENT TO association reference set"),
  POSSIBLY_REPLACED_BY("1186921001", "POSSIBLY REPLACED BY association reference set"),
  REFERS_TO("900000000000531004", "REFERS TO concept association reference set"),
  REPLACED_BY("900000000000526001", "REPLACED BY association reference set"),
  SAME_AS("900000000000527005", "SAME AS association reference set"),
  SIMILAR_TO("900000000000529008", "SIMILAR TO association reference set"),
  WAS_A("900000000000528000", "WAS A association reference set");

  private final String value;
  private final String label;

  HistoricalAssociationReferenceSet(String value, String label) {
    this.value = value;
    this.label = label;
  }

  public static Set<String> getRefsetIds() {
    return Arrays.stream(HistoricalAssociationReferenceSet.values())
        .map(HistoricalAssociationReferenceSet::getValue)
        .collect(Collectors.toSet());
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
