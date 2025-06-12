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
package au.gov.digitalhealth.lingo.service.schema;

import au.gov.digitalhealth.lingo.configuration.model.BasePropertyDefinition;
import au.gov.digitalhealth.lingo.configuration.model.ExternalIdentifierDefinition;
import au.gov.digitalhealth.lingo.configuration.model.NonDefiningPropertyDefinition;
import au.gov.digitalhealth.lingo.configuration.model.ReferenceSetDefinition;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.NonDefiningPropertyDataType;

public class SchemaFactory {

  public static final String IDENTIFIER_SCHEME = "identifierScheme";
  public static final String VALUE_OBJECT_FIELD = "valueObject";
  public static final String VALUE_FIELD = "value";

  private SchemaFactory() {}

  public static ObjectProperty create(BasePropertyDefinition baseProperty) {
    if (baseProperty instanceof ExternalIdentifierDefinition externalIdentifierDefinition) {
      return create(externalIdentifierDefinition);
    } else if (baseProperty
        instanceof NonDefiningPropertyDefinition nonDefiningPropertyDefinition) {
      return create(nonDefiningPropertyDefinition);
    } else if (baseProperty instanceof ReferenceSetDefinition referenceSetDefinition) {
      return create(referenceSetDefinition);
    } else {
      throw new IllegalArgumentException(
          "Unknown NonDefiningBase property type: " + baseProperty.getClass());
    }
  }

  public static ObjectProperty create(ExternalIdentifierDefinition mapping) {
    ObjectProperty identifierSchema = new ObjectProperty();
    identifierSchema.setTitle(mapping.getTitle());
    identifierSchema.addProperty(IDENTIFIER_SCHEME, ConstProperty.create(mapping.getName()));
    identifierSchema.addProperty("type", ConstProperty.create(mapping.getPropertyType().name()));

    if (mapping.getDataType().equals(NonDefiningPropertyDataType.CONCEPT)
        || mapping.getDataType().equals(NonDefiningPropertyDataType.CODED)) {
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
      identifierSchema.addProperty("value", property);
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

  public static ObjectProperty create(NonDefiningPropertyDefinition property) {
    ObjectProperty propertySchema = new ObjectProperty();
    propertySchema.setTitle(property.getTitle());
    // TODO change this to "name" instead of "identifierScheme"? More general than just external
    // identifiers
    propertySchema.addProperty(IDENTIFIER_SCHEME, ConstProperty.create(property.getName()));
    propertySchema.addProperty("type", ConstProperty.create(property.getPropertyType().name()));

    propertySchema.addProperty(
        getPropertyNameForType(property.getDataType().toString()), getProperty(property));

    return propertySchema;
  }

  private static Property getProperty(NonDefiningPropertyDefinition nonDefiningPropertyDefinition) {
    Property returnValue = null;

    if (nonDefiningPropertyDefinition.getAllowedValues() != null
        && !nonDefiningPropertyDefinition.getAllowedValues().isEmpty()) {
      EnumProperty property = new EnumProperty();
      property.getEnumValues().addAll(nonDefiningPropertyDefinition.getAllowedValues());
      returnValue = property;
    } else if (nonDefiningPropertyDefinition
        .getDataType()
        .equals(NonDefiningPropertyDataType.CONCEPT)) {
      ReferenceProperty property = new ReferenceProperty();
      property.setTitle(nonDefiningPropertyDefinition.getTitle());
      property.setReference("#/$defs/SnowstormConceptMini");
      returnValue = property;
    } else {
      StringProperty items = new StringProperty();
      if (nonDefiningPropertyDefinition.getValueRegexValidation() != null) {
        items.setPattern(nonDefiningPropertyDefinition.getValueRegexValidation());
        items
            .getErrorMessage()
            .put(
                "pattern",
                "Please enter a valid "
                    + nonDefiningPropertyDefinition.getTitle()
                    + " matching "
                    + nonDefiningPropertyDefinition.getValueRegexValidation());
      }
      returnValue = items;
    }

    returnValue.setTitle(nonDefiningPropertyDefinition.getTitle());
    return returnValue;
  }

  private static String getPropertyNameForType(String dataType) {
    if (dataType.equals(NonDefiningPropertyDataType.CONCEPT.toString())) {
      return VALUE_OBJECT_FIELD;
    }
    return VALUE_FIELD;
  }

  public static ObjectProperty create(ReferenceSetDefinition referenceSetDefinition) {
    ObjectProperty referenceSetSchema = new ObjectProperty();
    referenceSetSchema.setTitle(referenceSetDefinition.getTitle());
    referenceSetSchema.addProperty(
        IDENTIFIER_SCHEME, ConstProperty.create(referenceSetDefinition.getName()));
    referenceSetSchema.addProperty(
        "type", ConstProperty.create(referenceSetDefinition.getPropertyType().name()));

    return referenceSetSchema;
  }
}
