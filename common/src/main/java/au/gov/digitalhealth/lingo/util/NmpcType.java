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

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import lombok.Getter;

/**
 * Enum representing the types of NMPC (National Medicines Product Classification) concepts. Each
 * enum constant corresponds to a specific NMPC type with its value and label.
 */
@Getter
public enum NmpcType implements LingoConstants {
  NMPC_DEVICE("680581000220102", "NMPC Device (qualifier value)"),
  NMPC_MEDICATION("680591000220104", "NMPC Medication (qualifier value)"),
  NMPC_VACCINE("680601000220106", "NMPC Vaccine (qualifier value))"),
  NMPC_NUTRITIONAL_SUPPLEMENT("680611000220109", "NMPC Nutritional Supplement (qualifier value)");

  private final String value;
  private final String label;

  NmpcType(String value) {
    this.value = value;
    this.label = null;
  }

  NmpcType(String value, String label) {
    this.value = value;
    this.label = label;
  }

  public SnowstormConceptMini snowstormConceptMini() {
    return new SnowstormConceptMini()
        .conceptId(getValue())
        .pt(
            new SnowstormTermLangPojo()
                .term(getLabel().replace(" (qualifier value)", ""))
                .lang("en"))
        .fsn(new SnowstormTermLangPojo().term(getLabel()).lang("en"));
  }

  @Override
  public String toString() {
    return getValue();
  }

  @Override
  public boolean hasLabel() {
    return this.label != null;
  }
}
