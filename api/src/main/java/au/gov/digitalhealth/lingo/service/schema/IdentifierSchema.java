package au.gov.digitalhealth.lingo.service.schema;

import au.gov.digitalhealth.lingo.configuration.model.MappingRefset;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@JsonInclude(JsonInclude.Include.NON_EMPTY)
@Data
public class IdentifierSchema extends ObjectProperty {

  public static IdentifierSchema create(MappingRefset mapping) {
    IdentifierSchema identifierSchema = new IdentifierSchema();
    identifierSchema.setTitle(mapping.getTitle());
    identifierSchema.addProperty("identifierScheme", ConstProperty.create(mapping.getName()));
    setIdentifierValue(mapping, identifierSchema);
    setRelationshipType(mapping, identifierSchema);
    return identifierSchema;
  }

  private static void setIdentifierValue(MappingRefset mapping, IdentifierSchema identifierSchema) {
    if (mapping.isMultiValued()) {
      ArrayProperty property = new ArrayProperty();
      StringProperty items = getStringProperty(mapping);
      property.setItems(items);
      identifierSchema.addProperty("identifierValues", property);
    } else {
      StringProperty property = getStringProperty(mapping);
      identifierSchema.addProperty("identifierValue", property);
    }
  }

  private static StringProperty getStringProperty(MappingRefset mapping) {
    StringProperty items = new StringProperty();
    items.setTitle(mapping.getTitle());
    items.setPattern(mapping.getValueRegexValidation());
    items
        .getErrorMessage()
        .put(
            "pattern",
            "Please enter a valid "
                + mapping.getTitle()
                + " matching "
                + mapping.getValueRegexValidation());
    return items;
  }

  private static void setRelationshipType(
      MappingRefset mapping, IdentifierSchema identifierSchema) {
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
  }

  public void addProperty(String name, Property property) {
    properties.put(name, property);
  }
}
