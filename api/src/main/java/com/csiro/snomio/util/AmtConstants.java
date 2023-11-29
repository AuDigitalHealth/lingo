package com.csiro.snomio.util;

public enum AmtConstants implements SnomioConstants {
  MPP_REFSET_ID("929360081000036101", "Medicinal product pack reference set (foundation metadata concept)"),
  TPP_REFSET_ID("929360041000036105", "Trade product pack reference set (foundation metadata concept)"),
  CTPP_REFSET_ID("929360051000036108", "Containered trade product pack reference set (foundation metadata concept)"),
  TPUU_REFSET_ID("929360031000036100", "Trade product unit of use reference set (foundation metadata concept)"),
  MPUU_REFSET_ID("929360071000036103", "Medicinal product unit of use reference set (foundation metadata concept)"),
  MP_REFSET_ID("929360061000036106", "Medicinal product reference set (foundation metadata concept)"),
  HAS_CONTAINER_TYPE("30465011000036106", "has container type (relationship type)"),
  CONTAINS_PACKAGED_CD("999000011000168107", "Contains packaged clinical drug (attribute)"),
  HAS_OTHER_IDENTIFYING_INFORMATION("999000001000168109", "Has other identifying information (attribute)"),
  HAS_TOTAL_QUANTITY_VALUE("999000041000168106", "Has total quantity value (attribute)"),
  HAS_TOTAL_QUANTITY_UNIT("999000051000168108", "Has total quantity unit (attribute)"),
  CONCENTRATION_STRENGTH_VALUE("999000021000168100", "Has concentration strength value (attribute)"),
  CONCENTRATION_STRENGTH_UNIT("999000031000168102", "Has concentration strength unit (attribute)"),
  HAS_DEVICE_TYPE("999000061000168105", "Has device type (attribute)"),
  ARTGID_REFSET("11000168105", "Australian Register of Therapeutic Goods identifier reference set (foundation metadata concept)"),
  CONTAINS_DEVICE("999000081000168101"),
  CONTAINS_PACKAGED_DEVICE("999000111000168106"),
  SCT_AU_MODULE("32506021000036107", "SNOMED Clinical Terms Australian extension (core metadata concept)"),
  HAS_NUMERATOR_UNIT("700000091000036104", "has numerator units (attribute)"),
  HAS_DENOMINATOR_UNIT("700000071000036103", "has denominator units (attribute)"),
  ADRS("32570271000036106", "Australian English language reference set (foundation metadata concept)"),
  GB_LANG_REFSET_ID("900000000000508004", "Great Britain English language reference set (foundation metadata concept)"),
  US_LANG_REFSET_ID("900000000000509007", "United States of America English language reference set (foundation metadata concept)"),
  ARTGID_SCHEME("https://www.tga.gov.au/artg"),
  COUNT_OF_CONTAINED_COMPONENT_INGREDIENT("999000131000168101", "Count of contained component ingredient (attribute)");

  private final String value;
  private final String label;

  private AmtConstants(String value) {
    this.value = value;
    this.label = null;
  }

  private AmtConstants(String value, String label) {
    this.value = value;
    this.label = label;
  }

  public String getValue() {
    return value;
  }

  public String toString() {
    return getValue();
  }

  public String getLabel() {
    return label;
  }

  public boolean hasLabel() {
    return label != null;
  }
}
