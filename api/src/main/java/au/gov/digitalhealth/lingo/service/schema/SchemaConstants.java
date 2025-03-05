package au.gov.digitalhealth.lingo.service.schema;

public final class SchemaConstants {
  public static final String EXTERNAL_IDENTIFIERS = "externalIdentifiers";
  public static final String REFERENCE_SETS = "referenceSets";
  public static final String DEFS = "$defs";
  public static final String NON_DEFINING_PROPERTIES = "nonDefiningProperties";

  private SchemaConstants() {
    throw new IllegalStateException("Constants class");
  }
}
