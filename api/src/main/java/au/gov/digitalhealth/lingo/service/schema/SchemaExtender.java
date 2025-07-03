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
import static au.gov.digitalhealth.lingo.service.schema.SchemaConstants.NON_DEFINING_PROPERTIES;

import au.gov.digitalhealth.lingo.configuration.model.BasePropertyDefinition;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.ProductType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashSet;
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

  public void updateEditSchema(
      ModelConfiguration modelConfiguration,
      JsonNode schemaNode,
      ModelLevel level,
      ProductType propertyType) {
    Set<BasePropertyDefinition> properties = new HashSet<>();
    properties.addAll(modelConfiguration.getMappingsByLevel(level));
    properties.addAll(modelConfiguration.getNonDefiningPropertiesByLevel(level));
    properties.addAll(modelConfiguration.getReferenceSetsByLevel(level));

    properties.removeIf(p -> p.getSuppressOnProductTypes().contains(propertyType));

    updateEditSchemaForProperties(
        schemaNode,
        properties,
        "NonDefiningProperty",
        "Non Defining Properties",
        NON_DEFINING_PROPERTIES,
        level);
  }

  public void updateSchema(
      ModelConfiguration modelConfiguration,
      JsonNode schemaNode,
      ProductType propertyType,
      String... productPropertyNames) {

    Set<BasePropertyDefinition> properties = new HashSet<>();
    properties.addAll(modelConfiguration.getMappings());
    properties.addAll(modelConfiguration.getNonDefiningProperties());
    properties.addAll(modelConfiguration.getReferenceSets());

    properties.removeIf(p -> p.getSuppressOnProductTypes().contains(propertyType));

    updateSchemaForProperties(
        schemaNode,
        properties,
        "NonDefiningProperty",
        "Non Defining Properties",
        NON_DEFINING_PROPERTIES,
        productPropertyNames);
  }

  private void updateEditSchemaForProperties(
      JsonNode schemaNode,
      Set<BasePropertyDefinition> properties,
      String jsonTypeName,
      String title,
      String propertyName,
      ModelLevel level) {

    ArrayProperty nonDefiningProperty =
        getArrayProperties(
            schemaNode,
            properties,
            jsonTypeName,
            title,
            level.getModelLevelType().isPackageLevel()
                ? ProductPackageType.PACKAGE
                : ProductPackageType.PRODUCT);

    if (nonDefiningProperty != null) {
      schemaNode
          .withObjectProperty(PROPERTIES)
          .set(propertyName, objectMapper.valueToTree(nonDefiningProperty));
    }
  }

  private void updateSchemaForProperties(
      JsonNode schemaNode,
      Set<BasePropertyDefinition> properties,
      String jsonTypeName,
      String title,
      String propertyName,
      String... productPropertyNames) {

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
      for (String productPropertyName : productPropertyNames) {
        schemaNode
            .withObjectProperty(DEFS)
            .withObjectProperty(productPropertyName)
            .withObjectProperty(PROPERTIES)
            .set(propertyName, objectMapper.valueToTree(nonDefiningProductProperty));
      }
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
      Set<BasePropertyDefinition> properties,
      String jsonTypeName,
      String title,
      ProductPackageType productPackageType) {

    Set<BasePropertyDefinition> levelMatchingProperties =
        properties.stream()
            .filter(m -> m.getLevel().equals(productPackageType))
            .collect(Collectors.toSet());

    ArrayProperty resultingProperty = null;
    if (!levelMatchingProperties.isEmpty()) {
      AnyOfList referenceSetList = new AnyOfList();
      levelMatchingProperties.forEach(
          refset -> referenceSetList.getAnyOf().add(SchemaFactory.create(refset)));

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
