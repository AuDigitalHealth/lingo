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

import lombok.Getter;

/**
 * Constants for AMT (Australian Medicines Terminology) related values - these are relationship
 * types bespoke to AMT or originating from AMT
 */
@Getter
public enum AmtConstants implements LingoConstants {
  //
  // Relationship types
  //
  HAS_CONTAINER_TYPE("30465011000036106", "Has container type (attribute)"),
  CONTAINS_PACKAGED_CD("999000011000168107", "Contains packaged clinical drug (attribute)"),
  HAS_OTHER_IDENTIFYING_INFORMATION(
      "999000001000168109", "Has other identifying information (attribute)"),
  HAS_TOTAL_QUANTITY_VALUE("999000041000168106", "Has total quantity value (attribute)"),
  HAS_TOTAL_QUANTITY_UNIT("999000051000168108", "Has total quantity unit (attribute)"),
  CONCENTRATION_STRENGTH_VALUE(
      "999000021000168100", "Has concentration strength value (attribute)"),
  CONCENTRATION_STRENGTH_UNIT("999000031000168102", "Has concentration strength unit (attribute)"),
  HAS_DEVICE_TYPE("999000061000168105", "Has device type (attribute)"),
  ARTGID_REFSET(
      "11000168105",
      "Australian Register of Therapeutic Goods identifier reference set (foundation metadata concept)"),
  CONTAINS_DEVICE("999000081000168101", "Contains device (attribute)"),
  CONTAINS_PACKAGED_DEVICE("999000111000168106", "Contains packaged device (attribute)"),
  SCT_AU_MODULE(
      "32506021000036107", "SNOMED Clinical Terms Australian extension (core metadata concept)"),
  HAS_NUMERATOR_UNIT("700000091000036104", "has numerator units (attribute)"),
  HAS_DENOMINATOR_UNIT("700000071000036103", "has denominator units (attribute)"),
  COUNT_OF_CONTAINED_COMPONENT_INGREDIENT(
      "999000131000168101", "Count of contained component ingredient (attribute)"),
  COUNT_OF_CONTAINED_PACKAGE_TYPE(
      "999000091000168103", "Count of contained package types (attribute)"),
  COUNT_OF_DEVICE_TYPE("999000101000168108", "Count of device type (attribute)"),
  // todo - why no useages?
  COUNT_OF_CD_TYPE("1142143009", "Count of clinical drug type (attribute)"),
  // default value for OII if there isn't one
  NO_OII_VALUE("None");

  private final String value;
  private final String label;

  AmtConstants(String value) {
    this.value = value;
    this.label = null;
  }

  AmtConstants(String value, String label) {
    this.value = value;
    this.label = label;
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
