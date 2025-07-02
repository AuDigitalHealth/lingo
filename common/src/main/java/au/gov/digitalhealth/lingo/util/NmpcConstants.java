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
 * Enum representing constants specific to NMPC (National Medicines and Poisons Code) and their
 * associated metadata properties, such as relationship types and product classifications.
 *
 * <p>The constants encapsulate a value and a label, where the value is typically a unique
 * identifier and the label provides a descriptive name. These constants also include methods for
 * integration with Snowstorm, providing metadata like concept ID, preferred term, and fully
 * specified name.
 *
 * <p>Each constant implements the LingoConstants interface, ensuring consistency in methods for
 * retrieving values and labels, as well as checking the presence of a label.
 */
@Getter
public enum NmpcConstants implements LingoConstants {
  //
  // Relationship types
  //
  NMPC_DEVICE("680581000220102", "NMPC Device (qualifier value)"),
  NMPC_MEDICATION("680591000220104", "NMPC Mediciation (qualifier value)"),
  NMPC_VACCINE("680601000220106", "NMPC Vaccine (qualifier value))"),
  HAS_NMPC_PRODUCT_TYPE("680011000220100", "Has NMPC Product Type (attribute)"),
  NMPC_NUTRITIONAL_SUPPLEMENT("680611000220109", "NMPC Nutritional Supplement (qualifier value)"),
  VIRTUAL_MEDICINAL_PRODUCT("660341000220102", "Virtual medicinal product (product)"),
  ACTIVE_IMMUNITY_STIMULANT("318331000221102", "Active immunity stimulant role (role)");

  private final String value;
  private final String label;

  NmpcConstants(String value) {
    this.value = value;
    this.label = null;
  }

  NmpcConstants(String value, String label) {
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
