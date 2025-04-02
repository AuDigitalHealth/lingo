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
  public static final String PROPERTIES = "properties";

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
          .withObjectProperty(PROPERTIES)
          .set(propertyName, objectMapper.valueToTree(nonDefiningProperty));
    }

    ArrayProperty nonDefiningProductProperty =
        getArrayProperties(schemaNode, properties, jsonTypeName, title, ProductPackageType.PRODUCT);

    if (nonDefiningProductProperty != null) {
      schemaNode
          .withObjectProperty(DEFS)
          .withObjectProperty("ProductDetails")
          .withObjectProperty(PROPERTIES)
          .set(propertyName, objectMapper.valueToTree(nonDefiningProductProperty));
    }

    ArrayProperty nonDefiningSubpackProperty =
        getArrayProperties(
            schemaNode, properties, jsonTypeName, title, ProductPackageType.CONTAINED_PACKAGE);

    if (nonDefiningSubpackProperty != null) {
      schemaNode
          .withObjectProperty(DEFS)
          .withObjectProperty("PackageDetails")
          .withObjectProperty(PROPERTIES)
          .set(propertyName, objectMapper.valueToTree(nonDefiningSubpackProperty));
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

      String updatedJsonTypeName = productPackageType + "_" + jsonTypeName;
      schemaNode
          .withObjectProperty(DEFS)
          .set(updatedJsonTypeName, objectMapper.valueToTree(referenceSetList));

      resultingProperty = new ArrayProperty();
      resultingProperty.setItems(new ReferenceProperty("#/$defs/" + updatedJsonTypeName));
      resultingProperty.setTitle(title);
    }
    return resultingProperty;
  }
}
