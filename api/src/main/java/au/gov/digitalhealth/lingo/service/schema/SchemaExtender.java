package au.gov.digitalhealth.lingo.service.schema;

import static au.gov.digitalhealth.lingo.service.schema.SchemaConstants.DEFS;
import static au.gov.digitalhealth.lingo.service.schema.SchemaConstants.EXTERNAL_IDENTIFIERS;
import static au.gov.digitalhealth.lingo.service.schema.SchemaConstants.NON_DEFINING_PROPERTIES;
import static au.gov.digitalhealth.lingo.service.schema.SchemaConstants.REFERENCE_SETS;

import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.NonDefiningBase;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class SchemaExtender {

  public static final String ITEMS = "items";
  public static final String UI_OPTIONS = "ui:options";
  public static final String UI_WIDGET = "ui:widget";

  ObjectMapper objectMapper;

  public SchemaExtender(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public void updateSchema(ModelConfiguration modelConfiguration, JsonNode schemaNode) {
    updateSchemaForProperties(
        schemaNode,
        modelConfiguration.getNonDefiningProperties().stream()
            .map(NonDefiningBase.class::cast)
            .collect(Collectors.toSet()),
        "NonDefiningProperty",
        "Non Defining Properties",
        NON_DEFINING_PROPERTIES);
    updateSchemaForProperties(
        schemaNode,
        modelConfiguration.getReferenceSets().stream()
            .map(NonDefiningBase.class::cast)
            .collect(Collectors.toSet()),
        "ReferenceSet",
        "Reference Sets",
        REFERENCE_SETS);
    updateSchemaForProperties(
        schemaNode,
        modelConfiguration.getMappings().stream()
            .map(NonDefiningBase.class::cast)
            .collect(Collectors.toSet()),
        "MappingRefset",
        "External Identifiers",
        EXTERNAL_IDENTIFIERS);
  }

  private void updateSchemaForProperties(
      JsonNode schemaNode,
      Set<NonDefiningBase> properties,
      String jsonTypeName,
      String title,
      String propertyName) {

    ArrayProperty nonDefiningProperty =
        getArrayProperties(schemaNode, properties, jsonTypeName, title, ProductPackageType.PACKAGE);

    if (nonDefiningProperty != null) {
      schemaNode
          .withObjectProperty("properties")
          .set(propertyName, objectMapper.valueToTree(nonDefiningProperty));
    }

    ArrayProperty nonDefiningProductProperty =
        getArrayProperties(schemaNode, properties, jsonTypeName, title, ProductPackageType.PRODUCT);

    if (nonDefiningProductProperty != null) {
      schemaNode
          .withObjectProperty(DEFS)
          .withObjectProperty("ProductDetails")
          .withObjectProperty("properties")
          .set(propertyName, objectMapper.valueToTree(nonDefiningProductProperty));
    }
  }

  private ArrayProperty getArrayProperties(
      JsonNode schemaNode,
      Set<NonDefiningBase> properties,
      String jsonTypeName,
      String title,
      ProductPackageType productPackageType) {

    Set<NonDefiningBase> levelMatchingProperties =
        properties.stream()
            .filter(m -> m.getLevel().equals(productPackageType))
            .collect(Collectors.toSet());

    ArrayProperty resultingProperty = null;
    if (!levelMatchingProperties.isEmpty()) {
      OneOfList referenceSetList = new OneOfList();
      levelMatchingProperties.forEach(
          refset -> referenceSetList.getOneOf().add(SchemaFactory.create(refset)));

      schemaNode
          .withObjectProperty(DEFS)
          .set(jsonTypeName, objectMapper.valueToTree(referenceSetList));

      resultingProperty = new ArrayProperty();
      resultingProperty.setItems(new ReferenceProperty("#/$defs/" + jsonTypeName));
      resultingProperty.setTitle(title);
    }
    return resultingProperty;
  }
}
