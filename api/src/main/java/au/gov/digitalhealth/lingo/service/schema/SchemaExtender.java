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
  public static final String ONE_OF = "oneOf";

  ObjectMapper objectMapper;

  public SchemaExtender(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public void updateEditSchema(
      ModelConfiguration modelConfiguration,
      JsonNode schemaNode,
      ModelLevel level,
      ProductType productType) {
    Set<BasePropertyDefinition> properties = new HashSet<>();
    properties.addAll(modelConfiguration.getMappingsByLevel(level));
    properties.addAll(modelConfiguration.getNonDefiningPropertiesByLevel(level));
    properties.addAll(modelConfiguration.getReferenceSetsByLevel(level));

    properties.removeIf(p -> p.getSuppressOnProductTypes().contains(productType));

    updateEditSchemaForProperties(schemaNode, properties, level, productType);
  }

  public void updateSchema(
      ModelConfiguration modelConfiguration, JsonNode schemaNode, ProductType propertyType) {

    Set<BasePropertyDefinition> properties = new HashSet<>();
    properties.addAll(modelConfiguration.getMappings());
    properties.addAll(modelConfiguration.getNonDefiningProperties());
    properties.addAll(modelConfiguration.getReferenceSets());

    properties.removeIf(p -> p.getSuppressOnProductTypes().contains(propertyType));

    updateSchemaForProperties(schemaNode, properties, propertyType);
  }

  private void updateEditSchemaForProperties(
      JsonNode schemaNode,
      Set<BasePropertyDefinition> properties,
      ModelLevel level,
      ProductType productType) {

    ArrayProperty nonDefiningProperty =
        injectTypeDef(
            schemaNode,
            properties,
            productType,
            level.getModelLevelType().isPackageLevel()
                ? ProductPackageType.PACKAGE
                : ProductPackageType.PRODUCT);

    if (nonDefiningProperty != null) {
      schemaNode
          .withObjectProperty(PROPERTIES)
          .set(
              SchemaConstants.NON_DEFINING_PROPERTIES,
              objectMapper.valueToTree(nonDefiningProperty));
    }
  }

  private void updateSchemaForProperties(
      JsonNode schemaNode, Set<BasePropertyDefinition> properties, ProductType productType) {

    injectTypeDef(schemaNode, properties, productType, ProductPackageType.PACKAGE);

    injectTypeDef(schemaNode, properties, productType, ProductPackageType.PRODUCT);

    injectTypeDef(schemaNode, properties, productType, ProductPackageType.CONTAINED_PACKAGE);
  }

  private ArrayProperty injectTypeDef(
      JsonNode schemaNode,
      Set<BasePropertyDefinition> properties,
      ProductType productType,
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

      String updatedJsonTypeName =
          productType + "_" + productPackageType + "_" + "NonDefiningProperty";
      schemaNode
          .withObjectProperty(DEFS)
          .set(updatedJsonTypeName, objectMapper.valueToTree(referenceSetList));

      resultingProperty = new ArrayProperty();
      resultingProperty.setItems(new ReferenceProperty("#/$defs/" + updatedJsonTypeName));
      resultingProperty.setTitle("Non Defining Properties");
    }
    return resultingProperty;
  }
}
