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

@Getter
public enum SnomedConstants implements LingoConstants {
  HAS_PRECISE_ACTIVE_INGREDIENT("762949000", "Has precise active ingredient (attribute)"),
  IS_A("116680003", "Is a (attribute)"),
  HAS_ACTIVE_INGREDIENT("127489000", "Has active ingredient (attribute)"),
  HAS_BOSS("732943007", "Has basis of strength substance (attribute)"),
  CONTAINS_CD("774160008", "Contains clinical drug (attribute)"),
  HAS_PACK_SIZE_UNIT("774163005", "Has pack size unit (attribute)"),
  HAS_PACK_SIZE_VALUE("1142142004", "Has pack size (attribute)"),
  HAS_PRODUCT_NAME("774158006", "Has product name (attribute)"),
  HAS_MANUFACTURED_DOSE_FORM("411116001", "Has manufactured dose form (attribute)"),
  DEFINED(
      "900000000000073002",
      "Sufficiently defined by necessary conditions definition status (core metadata concept)"),
  PRIMITIVE(
      "900000000000074008",
      "Not sufficiently defined by necessary conditions definition status (core metadata concept)"),
  SOME_MODIFIER("900000000000450001", "Modifier (core metadata concept)"),
  STATED_RELATIONSHUIP_CHARACTRISTIC_TYPE(
      "900000000000010007", "Stated relationship (core metadata concept)"),
  MEDICINAL_PRODUCT("763158003", "Medicinal product (product)"),
  MEDICINAL_PRODUCT_PACKAGE("781405001", "Medicinal product package (product)"),
  MEDICINAL_PRODUCT_SEMANTIC_TAG("medicinal product"),
  CLINICAL_DRUG_SEMANTIC_TAG("clinical drug"),
  PHYSICAL_OBJECT_SEMANTIC_TAG("physical object"),
  PRODUCT_SEMANTIC_TAG("product"),
  BRANDED_CLINICAL_DRUG_SEMANTIC_TAG("branded clinical drug"),
  BRANDED_PHYSICAL_OBJECT_SEMANTIC_TAG("branded physical object"),
  BRANDED_PRODUCT_SEMANTIC_TAG("branded product"),
  CONTAINERIZED_BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG(
      "containerized branded clinical drug package"),
  CONTAINERIZED_BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG(
      "containerized branded physical object package"),
  CONTAINERIZED_BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG("containerized branded product package"),
  BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG("branded clinical drug package"),
  BRANDED_PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG("branded physical object package"),
  BRANDED_PRODUCT_PACKAGE_SEMANTIC_TAG("branded product package"),
  CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG("clinical drug package"),
  PHYSICAL_OBJECT_PACKAGE_SEMANTIC_TAG("physical object package"),
  PRODUCT_PACKAGE_SEMANTIC_TAG("product package"),
  UNIT_OF_PRESENTATION("732935002", "Unit of presentation (unit of presentation)"),
  PREFERRED("PREFERRED"),
  ENTIRE_TERM_CASE_SENSITIVE("ENTIRE_TERM_CASE_SENSITIVE"),
  SYNONYM("SYNONYM"),
  FSN("FSN"),
  COUNT_OF_ACTIVE_INGREDIENT("1142140007", "Count of active ingredient (attribute)"),
  COUNT_OF_BASE_ACTIVE_INGREDIENT("1142139005", "Count of base of active ingredient (attribute)"),
  STATED_RELATIONSHIP("STATED_RELATIONSHIP"),
  ROLE_GROUP("609096000", "Role group (attribute)"),
  PACK("706437002", "Pack"),
  PACKAGE("999000071000168104", "Package (physical object)"),
  UNIT_MG("258684004", "mg"),
  UNIT_ML("258773002", "mL"),
  MAP_TARGET("mapTarget"),
  MAP_TYPE("mapType");

  private final String value;
  private final String label;

  SnomedConstants(String value) {
    this.value = value;
    this.label = null;
  }

  SnomedConstants(String value, String label) {
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
