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
import lombok.extern.java.Log;
import org.springframework.stereotype.Component;

@Component
@Log
public class SchemaExtender {

  public static final String ITEMS = "items";
  public static final String UI_OPTIONS = "ui:options";
  public static final String UI_WIDGET = "ui:widget";
  public static final String PROPERTIES = "properties";
  public static final String ONE_OF = "oneOf";

  /**
   * Property key on a medication-product-details schema variant whose presence indicates that
   * variant carries strength information (and is therefore a candidate for the strengthFormat
   * radio). Renames here must stay in sync with the JSON schemas under {@code resources/AMT} and
   * {@code resources/NMPC}.
   */
  public static final String ACTIVE_INGREDIENTS_KEY = "activeIngredients";

  /**
   * Discriminator value on the schema variant that carries no strengths — explicitly excluded from
   * strengthFormat injection.
   */
  public static final String NO_STRENGTH_PRODUCT_TYPE = "noStrength";

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

    if (propertyType == ProductType.MEDICATION
        && modelConfiguration.isNameGeneratorSupportsStrengthFormat()) {
      injectStrengthFormatIntoSchema(schemaNode);
    }
  }

  /**
   * Inject a {@code strengthFormat} property into every strength-bearing product-details variant in
   * the served schema. Targets any object whose {@code properties} block declares {@code
   * activeIngredients} — i.e. each {@code MedicationProductDetails} oneOf variant — except those
   * whose {@code productType.const} is {@code noStrength}. Walks the whole tree so the same code
   * handles schemas where the type is defined under {@code $defs} and schemas where it is inlined
   * (e.g. the bulk-pack and authoring schemas in NMPC).
   */
  private void injectStrengthFormatIntoSchema(JsonNode schemaNode) {
    com.fasterxml.jackson.databind.node.ObjectNode strengthFormatProp =
        com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
    strengthFormatProp.put("type", "string");
    strengthFormatProp.set(
        "enum",
        com.fasterxml.jackson.databind.node.JsonNodeFactory.instance
            .arrayNode()
            .add("inference")
            .add("simple")
            .add("ratio")
            .add("percentage"));
    strengthFormatProp.put("default", "inference");
    strengthFormatProp.put("title", "Strength format");

    try {
      walkAndInjectStrengthFormat(schemaNode, strengthFormatProp, 0);
    } catch (RuntimeException | StackOverflowError e) {
      log.log(
          java.util.logging.Level.WARNING,
          "Failed to inject strengthFormat into served schema; serving without the radio",
          e);
    }
  }

  /**
   * Defence-in-depth cap on recursion depth — pathological schemas (e.g. materialised $ref cycles)
   * would otherwise StackOverflowError on the request thread. 64 is comfortably above the deepest
   * known schema (~12 levels).
   */
  private static final int MAX_WALK_DEPTH = 64;

  private void walkAndInjectStrengthFormat(
      JsonNode node, com.fasterxml.jackson.databind.node.ObjectNode strengthFormatProp, int depth) {
    if (depth > MAX_WALK_DEPTH) {
      log.warning(
          "Schema walk reached max depth "
              + MAX_WALK_DEPTH
              + "; stopping strengthFormat injection");
      return;
    }
    if (node.isObject()) {
      injectStrengthFormatIfTargetVariant(node, strengthFormatProp);
      java.util.Iterator<java.util.Map.Entry<String, JsonNode>> it = node.fields();
      while (it.hasNext()) {
        walkAndInjectStrengthFormat(it.next().getValue(), strengthFormatProp, depth + 1);
      }
      return;
    }
    if (node.isArray()) {
      for (JsonNode child : node) {
        walkAndInjectStrengthFormat(child, strengthFormatProp, depth + 1);
      }
    }
  }

  private static void injectStrengthFormatIfTargetVariant(
      JsonNode node, com.fasterxml.jackson.databind.node.ObjectNode strengthFormatProp) {
    JsonNode properties = node.get(PROPERTIES);
    if (properties == null || !properties.isObject()) {
      return;
    }
    com.fasterxml.jackson.databind.node.ObjectNode props =
        (com.fasterxml.jackson.databind.node.ObjectNode) properties;
    if (!props.has(ACTIVE_INGREDIENTS_KEY) || props.has("strengthFormat")) {
      return;
    }
    JsonNode productTypeConst = props.path("productType").path("const");
    boolean isNoStrength =
        productTypeConst.isTextual() && NO_STRENGTH_PRODUCT_TYPE.equals(productTypeConst.asText());
    if (isNoStrength) {
      return;
    }
    props.set("strengthFormat", strengthFormatProp.deepCopy());
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
                : ProductPackageType.PRODUCT,
            false);

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

    injectTypeDef(schemaNode, properties, productType, ProductPackageType.PACKAGE, true);

    injectTypeDef(schemaNode, properties, productType, ProductPackageType.PRODUCT, true);

    injectTypeDef(schemaNode, properties, productType, ProductPackageType.CONTAINED_PACKAGE, true);
  }

  private ArrayProperty injectTypeDef(
      JsonNode schemaNode,
      Set<BasePropertyDefinition> properties,
      ProductType productType,
      ProductPackageType productPackageType,
      boolean filterProductPackageType) {

    Set<BasePropertyDefinition> levelMatchingProperties =
        properties.stream()
            .filter(m -> !filterProductPackageType || m.getLevel().equals(productPackageType))
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
