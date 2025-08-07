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

import au.gov.digitalhealth.lingo.configuration.model.*;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.NonDefiningPropertyDataType;

import java.util.List;
import java.util.Map;

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
    setTitleAndDescription(mapping, identifierSchema);
    identifierSchema.addProperty(IDENTIFIER_SCHEME, ConstProperty.create(mapping.getName()));
    identifierSchema.addProperty("type", ConstProperty.create(mapping.getPropertyType().name()));

    if (mapping.getDataType().equals(NonDefiningPropertyDataType.CONCEPT)
        || mapping.getDataType().equals(NonDefiningPropertyDataType.CODED)) {
      ReferenceProperty property = new ReferenceProperty();
      setTitleAndDescription(mapping, property);
      property.setReference("#/$defs/SnowstormConceptMini");
      identifierSchema.addProperty("valueObject", property);
    } else if (mapping.getDataType().equals(NonDefiningPropertyDataType.UNSIGNED_INTEGER)
        || mapping.getDataType().equals(NonDefiningPropertyDataType.INTEGER)
        || mapping.getDataType().equals(NonDefiningPropertyDataType.DECIMAL)) {
      NumberProperty property = new NumberProperty();
      setTitleAndDescription(mapping, property);
      property.setPattern(mapping.getValueRegexValidation());
      property
          .getErrorMessage()
          .put(
              "pattern",
              (mapping.getValueValidationErrorMessage() == null
                  ? "Please enter a valid "
                      + mapping.getTitle()
                      + " matching "
                      + mapping.getValueRegexValidation()
                  : mapping.getValueValidationErrorMessage()));
      identifierSchema.addProperty("value", property);
    } else {
      StringProperty property;
      if (mapping.getDataType().equals(NonDefiningPropertyDataType.DATE)) {
        DateProperty dateProperty = new DateProperty();
        dateProperty.setDateFormat(mapping.getFormat());
        property = dateProperty;
      } else {
        property = new StringProperty();
      }

      setTitleAndDescription(mapping, property);
      property.setPattern(mapping.getValueRegexValidation());
      property
          .getErrorMessage()
          .put(
              "pattern",
              (mapping.getValueValidationErrorMessage() == null
                  ? "Please enter a valid "
                      + mapping.getTitle()
                      + " matching "
                      + mapping.getValueRegexValidation()
                  : mapping.getValueValidationErrorMessage()));
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

    // Additional Fields
    if (!mapping.getAdditionalFields().isEmpty()) {
      ObjectProperty additionalFields = new ObjectProperty();
      for (Map.Entry<String, AdditionalFieldDefinition> entry : mapping.getAdditionalFields().entrySet()) {
        String key = entry.getKey();
        AdditionalFieldDefinition fieldDefinition = entry.getValue();
        ObjectProperty innerField = new ObjectProperty();
        innerField.setTitle(fieldDefinition.getTitle());

        if (fieldDefinition.getDataType().equals(NonDefiningPropertyDataType.CONCEPT)
                || fieldDefinition.getDataType().equals(NonDefiningPropertyDataType.CODED)) {
          ReferenceProperty ref = new ReferenceProperty();
          ref.setReference("#/$defs/SnowstormConceptMini");
          innerField.addProperty("valueObject", ref);
        } else {
          StringProperty valueProp = new StringProperty();

          if (fieldDefinition.getAllowedValues() != null && !fieldDefinition.getAllowedValues().isEmpty()) {
            EnumProperty enumValue = new EnumProperty();
            enumValue.getEnumValues().addAll(fieldDefinition.getAllowedValues());
            enumValue.setDefaultEnumValue(fieldDefinition.getAllowedValues().get(0));
            innerField.addProperty("value", enumValue);
          } else {
            valueProp.setPattern(fieldDefinition.getValueRegexValidation());
            valueProp.getErrorMessage().put(
                    "pattern",
                    fieldDefinition.getValueValidationErrorMessage() != null
                            ? fieldDefinition.getValueValidationErrorMessage()
                            : "Invalid value for " + fieldDefinition.getTitle()
            );
            innerField.addProperty("value", valueProp);
          }
        }

        innerField.setRequired(List.of("value"));
        additionalFields.addProperty(key, innerField);
      }


      identifierSchema.addProperty("additionalFields", additionalFields);
    }

    return identifierSchema;
  }

  public static ObjectProperty create(NonDefiningPropertyDefinition property) {
    ObjectProperty propertySchema = new ObjectProperty();
    setTitleAndDescription(property, propertySchema);
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
      setTitleAndDescription(nonDefiningPropertyDefinition, property);
      property.getEnumValues().addAll(nonDefiningPropertyDefinition.getAllowedValues());
      returnValue = property;
    } else if (nonDefiningPropertyDefinition
        .getDataType()
        .equals(NonDefiningPropertyDataType.CONCEPT)) {
      ReferenceProperty property = new ReferenceProperty();
      setTitleAndDescription(nonDefiningPropertyDefinition, property);
      property.setReference("#/$defs/SnowstormConceptMini");
      returnValue = property;
    } else {
      StringProperty items;
      if (nonDefiningPropertyDefinition.getDataType().equals(NonDefiningPropertyDataType.DATE)) {
        DateProperty dateProperty = new DateProperty();
        dateProperty.setDateFormat(nonDefiningPropertyDefinition.getFormat());
        items = dateProperty;
      } else {
        items = new StringProperty();
      }
      if (nonDefiningPropertyDefinition.getValueRegexValidation() != null) {
        items.setPattern(nonDefiningPropertyDefinition.getValueRegexValidation());
        items
            .getErrorMessage()
            .put(
                "pattern",
                (nonDefiningPropertyDefinition.getValueValidationErrorMessage() == null
                    ? "Please enter a valid "
                        + nonDefiningPropertyDefinition.getTitle()
                        + " matching "
                        + nonDefiningPropertyDefinition.getValueRegexValidation()
                    : nonDefiningPropertyDefinition.getValueValidationErrorMessage()));
      }
      returnValue = items;
    }

    setTitleAndDescription(nonDefiningPropertyDefinition, returnValue);
    return returnValue;
  }

  private static void setTitleAndDescription(
      BasePropertyDefinition nonDefiningPropertyDefinition, Property property) {
    property.setTitle(nonDefiningPropertyDefinition.getTitle());
    if (nonDefiningPropertyDefinition.getDescription() != null) {
      property.setDescription(nonDefiningPropertyDefinition.getDescription());
    }
  }

  private static String getPropertyNameForType(String dataType) {
    if (dataType.equals(NonDefiningPropertyDataType.CONCEPT.toString())) {
      return VALUE_OBJECT_FIELD;
    }
    return VALUE_FIELD;
  }

  public static ObjectProperty create(ReferenceSetDefinition referenceSetDefinition) {
    ObjectProperty referenceSetSchema = new ObjectProperty();
    setTitleAndDescription(referenceSetDefinition, referenceSetSchema);
    referenceSetSchema.addProperty(
        IDENTIFIER_SCHEME, ConstProperty.create(referenceSetDefinition.getName()));
    referenceSetSchema.addProperty(
        "type", ConstProperty.create(referenceSetDefinition.getPropertyType().name()));

    return referenceSetSchema;
  }
}
