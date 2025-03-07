package au.gov.digitalhealth.lingo.service.schema;

import au.gov.digitalhealth.lingo.configuration.model.MappingRefset;
import au.gov.digitalhealth.lingo.configuration.model.NonDefiningBase;
import au.gov.digitalhealth.lingo.configuration.model.NonDefiningProperty;
import au.gov.digitalhealth.lingo.configuration.model.ReferenceSet;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.NonDefiningPropertyDataType;

public class SchemaFactory {

  public static final String IDENTIFIER_SCHEME = "identifierScheme";

  private SchemaFactory() {}

  public static ObjectProperty create(NonDefiningBase baseProperty) {
    if (baseProperty instanceof MappingRefset mappingRefset) {
      return create(mappingRefset);
    } else if (baseProperty instanceof NonDefiningProperty nonDefiningProperty) {
      return create(nonDefiningProperty);
    } else if (baseProperty instanceof ReferenceSet referenceSet) {
      return create(referenceSet);
    } else {
      throw new IllegalArgumentException(
          "Unknown NonDefiningBase property type: " + baseProperty.getClass());
    }
  }

  public static ObjectProperty create(MappingRefset mapping) {
    ObjectProperty identifierSchema = new ObjectProperty();
    identifierSchema.setTitle(mapping.getTitle());
    identifierSchema.addProperty(IDENTIFIER_SCHEME, ConstProperty.create(mapping.getName()));

    if (mapping.getDataType().equals(NonDefiningPropertyDataType.CONCEPT)) {
      ReferenceProperty property = new ReferenceProperty();
      property.setTitle(mapping.getTitle());
      property.setReference("#/$defs/SnowstormConceptMini");
    } else {
      StringProperty property = new StringProperty();
      property.setTitle(mapping.getTitle());
      property.setPattern(mapping.getValueRegexValidation());
      property
          .getErrorMessage()
          .put(
              "pattern",
              "Please enter a valid "
                  + mapping.getTitle()
                  + " matching "
                  + mapping.getValueRegexValidation());
      identifierSchema.addProperty("identifierValue", property);
    }

    if (mapping.getMappingTypes().isEmpty()) {
      throw new IllegalArgumentException(
          "Mapping refset " + mapping.getName() + " has no mapping types");
    }

    if (mapping.getMappingTypes().size() == 1) {
      ConstProperty property = new ConstProperty();
      property.setTitle("Relationship type");
      property.setConstant(mapping.getMappingTypes().iterator().next().name());
      identifierSchema.addProperty("relationshipType", property);
    } else {
      EnumProperty property = new EnumProperty();
      property.setTitle("Relationship type");
      property.getEnumValues().addAll(mapping.getMappingTypes().stream().map(Enum::name).toList());
      identifierSchema.addProperty("relationshipType", property);
    }

    return identifierSchema;
  }

  public static ObjectProperty create(NonDefiningProperty property) {
    ObjectProperty propertySchema = new ObjectProperty();
    propertySchema.setTitle(property.getTitle());
    // TODO change this to "name" instead of "identifierScheme"? More general than just external
    // identifiers
    propertySchema.addProperty(IDENTIFIER_SCHEME, ConstProperty.create(property.getName()));

    propertySchema.addProperty("value", getProperty(property));

    return propertySchema;
  }

  private static Property getProperty(NonDefiningProperty nonDefiningProperty) {
    Property returnValue = null;

    if (nonDefiningProperty.getAllowedValues() != null
        && !nonDefiningProperty.getAllowedValues().isEmpty()) {
      EnumProperty property = new EnumProperty();
      property.getEnumValues().addAll(nonDefiningProperty.getAllowedValues());
      returnValue = property;
    } else if (nonDefiningProperty.getDataType().equals(NonDefiningPropertyDataType.CONCEPT)) {
      ReferenceProperty property = new ReferenceProperty();
      property.setTitle(nonDefiningProperty.getTitle());
      property.setReference("#/$defs/SnowstormConceptMini");
      returnValue = property;
    } else {
      StringProperty items = new StringProperty();
      if (nonDefiningProperty.getValueRegexValidation() != null) {
        items.setPattern(nonDefiningProperty.getValueRegexValidation());
        items
            .getErrorMessage()
            .put(
                "pattern",
                "Please enter a valid "
                    + nonDefiningProperty.getTitle()
                    + " matching "
                    + nonDefiningProperty.getValueRegexValidation());
      }
      returnValue = items;
    }

    returnValue.setTitle(nonDefiningProperty.getTitle());
    return returnValue;
  }

  public static ObjectProperty create(ReferenceSet referenceSet) {
    ObjectProperty referenceSetSchema = new ObjectProperty();
    referenceSetSchema.setTitle(referenceSet.getTitle());
    referenceSetSchema.addProperty(IDENTIFIER_SCHEME, ConstProperty.create(referenceSet.getName()));

    return referenceSetSchema;
  }
}
