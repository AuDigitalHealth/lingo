package au.gov.digitalhealth.lingo.util;

public enum InactivationReason implements LingoConstants {
  AMBIGUOUS("900000000000484002", "Ambiguous"),
  DUPLICATE("900000000000482003", "Duplicate"),
  ERRONEOUS("900000000000485001", "Erroneous"),
  OUTDATED("900000000000483008", "Outdated");

  private final String value;
  private final String label;

  InactivationReason(String value, String label) {
    this.value = value;
    this.label = label;
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
