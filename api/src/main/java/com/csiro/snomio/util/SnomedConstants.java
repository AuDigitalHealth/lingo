package com.csiro.snomio.util;

import lombok.Getter;

@Getter
public enum SnomedConstants implements SnomioConstants {
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
  BRANDED_CLINICAL_DRUG_SEMANTIC_TAG("branded clinical drug"),
  CONTAINERIZED_BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG(
      "containerized branded clinical drug package"),
  BRANDED_CLINICAL_DRUG_PACKAGE_SEMANTIC_TAG("branded clinical drug package"),
  UNIT_OF_PRESENTATION("732935002", "Unit of presentation (unit of presentation)"),
  PREFERRED("PREFERRED"),
  ENTIRE_TERM_CASE_SENSITIVE("ENTIRE_TERM_CASE_SENSITIVE"),
  SYNONYM("SYNONYM"),
  FSN("FSN"),
  COUNT_OF_ACTIVE_INGREDIENT("1142140007", "Count of active ingredient (attribute)"),
  COUNT_OF_BASE_ACTIVE_INGREDIENT("1142139005", "Count of base of active ingredient (attribute)"),
  STATED_RELATIONSHIP("STATED_RELATIONSHIP"),
  ROLE_GROUP("609096000", "Role group (attribute)");

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
}
