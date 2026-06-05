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

import static au.gov.digitalhealth.lingo.service.schema.SchemaConstants.NON_DEFINING_PROPERTIES;

import au.gov.digitalhealth.lingo.configuration.model.BasePropertyDefinition;
import au.gov.digitalhealth.lingo.configuration.model.BasePropertyWithValueDefinition;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.ModelLevel;
import au.gov.digitalhealth.lingo.configuration.model.ProductType;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.extern.java.Log;
import org.springframework.stereotype.Component;

@Component
@Log
public class UiSchemaExtender {

  public static final String ITEMS = "items";
  public static final String UI_OPTIONS = "ui:options";
  public static final String UI_WIDGET = "ui:widget";

  public static final String UI_FIELD = "ui:field";
  public static final String CONTAINED_PRODUCTS = "containedProducts";
  public static final String PRODUCT_DETAILS = "productDetails";
  private static final String PACKAGE_DETAILS = "packageDetails";

  /**
   * Same key as {@link SchemaExtender#ACTIVE_INGREDIENTS_KEY} — locator for variants needing the
   * strengthFormat radio.
   */
  public static final String ACTIVE_INGREDIENTS_KEY = SchemaExtender.ACTIVE_INGREDIENTS_KEY;

  private static final String UI_ORDER_KEY = "ui:order";
  private static final String STRENGTH_FORMAT_KEY = "strengthFormat";

  /** Defence-in-depth cap on recursion depth — see SchemaExtender.MAX_WALK_DEPTH. */
  private static final int MAX_WALK_DEPTH = 64;

  ObjectMapper objectMapper;

  public UiSchemaExtender(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public void updateUiSchema(
      ModelConfiguration modelConfiguration,
      JsonNode uiSchemaNode,
      ProductType productType,
      Set<BasePropertyDefinition> readOnlyProperties) {
    Set<BasePropertyDefinition> properties = new HashSet<>(modelConfiguration.getMappings());
    properties.addAll(modelConfiguration.getNonDefiningProperties());
    properties.addAll(modelConfiguration.getReferenceSets());
    properties.removeIf(p -> p.getSuppressOnProductTypes().contains(productType));

    Set<BasePropertyDefinition> hiddenProperties = new HashSet<>(modelConfiguration.getMappings());
    hiddenProperties.addAll(modelConfiguration.getNonDefiningProperties());
    hiddenProperties.addAll(modelConfiguration.getReferenceSets());
    hiddenProperties.removeIf(p -> !p.isHidden());

    updateUiSchemaForType(
        uiSchemaNode, NON_DEFINING_PROPERTIES, properties, readOnlyProperties, hiddenProperties);

    if (productType == ProductType.MEDICATION
        && modelConfiguration.isNameGeneratorSupportsStrengthFormat()) {
      injectStrengthFormatRadio(uiSchemaNode);
    }
  }

  /**
   * Inject a radio uiSchema entry next to every {@code activeIngredients} key in the served
   * uiSchema, and append {@code strengthFormat} to that variant's {@code ui:order} immediately
   * after {@code activeIngredients}. Walks the whole tree so both inlined and {@code $defs}-based
   * uiSchema shapes are handled.
   *
   * <p>The schema-side injection (in {@link SchemaExtender}) already skips the {@code noStrength}
   * variant, and the uiSchema walker here is intentionally permissive on the assumption that RJSF
   * silently ignores uiSchema entries with no matching schema property. <strong>That assumption is
   * current RJSF behaviour, not enforced anywhere in this codebase</strong> — verify if upgrading
   * RJSF, or add a Cypress test that asserts the {@code noStrength} variant doesn't render the
   * radio.
   */
  private void injectStrengthFormatRadio(JsonNode uiSchemaNode) {
    ObjectNode radio = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
    radio.put(UI_WIDGET, "radio");
    radio.put("ui:title", "Strength format");
    ObjectNode options = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
    options.put("inline", true);
    radio.set(UI_OPTIONS, options);

    try {
      walkAndInjectRadio(uiSchemaNode, radio, 0);
    } catch (RuntimeException | StackOverflowError e) {
      log.log(
          java.util.logging.Level.WARNING,
          "Failed to inject strengthFormat radio into served uiSchema; serving without it",
          e);
    }
  }

  private void walkAndInjectRadio(JsonNode node, ObjectNode radio, int depth) {
    if (depth > MAX_WALK_DEPTH) {
      log.warning(
          "uiSchema walk reached max depth " + MAX_WALK_DEPTH + "; stopping radio injection");
      return;
    }
    if (node.isObject()) {
      ObjectNode obj = (ObjectNode) node;
      injectRadioIfTargetVariant(obj, radio);
      java.util.Iterator<java.util.Map.Entry<String, JsonNode>> it = obj.fields();
      while (it.hasNext()) {
        walkAndInjectRadio(it.next().getValue(), radio, depth + 1);
      }
      return;
    }
    if (node.isArray()) {
      for (JsonNode child : node) {
        walkAndInjectRadio(child, radio, depth + 1);
      }
    }
  }

  private void injectRadioIfTargetVariant(ObjectNode obj, ObjectNode radio) {
    if (!obj.has(ACTIVE_INGREDIENTS_KEY) || obj.has(STRENGTH_FORMAT_KEY)) {
      return;
    }
    obj.set(STRENGTH_FORMAT_KEY, radio.deepCopy());
    JsonNode uiOrder = obj.path(UI_ORDER_KEY);
    if (uiOrder.isArray()) {
      insertStrengthFormatAfterIngredientsInOrder((ArrayNode) uiOrder);
      return;
    }
    // ui:order absent on a variant we just injected into — strengthFormat will render in arbitrary
    // key position. Surface this so the schema authors can add a ui:order entry.
    log.warning(
        "uiSchema variant has activeIngredients but no ui:order; injected strengthFormat will"
            + " render in arbitrary position");
  }

  private static void insertStrengthFormatAfterIngredientsInOrder(ArrayNode uiOrder) {
    for (int i = 0; i < uiOrder.size(); i++) {
      if (ACTIVE_INGREDIENTS_KEY.equals(uiOrder.get(i).asText())) {
        uiOrder.insert(i + 1, STRENGTH_FORMAT_KEY);
        return;
      }
    }
    uiOrder.add(STRENGTH_FORMAT_KEY);
  }

  public void updateEditUiSchema(
      ModelConfiguration modelConfiguration,
      JsonNode uiSchemaNode,
      ModelLevel level,
      ProductType productType) {
    Set<BasePropertyDefinition> properties = new HashSet<>(modelConfiguration.getMappings());
    properties.addAll(modelConfiguration.getNonDefiningPropertiesByLevel(level));
    properties.addAll(modelConfiguration.getReferenceSetsByLevel(level));
    properties.addAll(modelConfiguration.getMappingsByLevel(level));

    properties.removeIf(p -> p.getSuppressOnProductTypes().contains(productType));

    updateUiSchemaForLevel(uiSchemaNode, NON_DEFINING_PROPERTIES, properties, level);
  }

  private void updateUiSchemaForLevel(
      JsonNode uiSchemaNode,
      String nodeName,
      Set<? extends BasePropertyDefinition> properties,
      ModelLevel level) {
    addUiNodeForPropertySet(
        (ObjectNode) uiSchemaNode,
        properties,
        nodeName,
        level.getModelLevelType().isPackageLevel()
            ? ProductPackageType.PACKAGE
            : ProductPackageType.PRODUCT,
        false,
        Set.of(),
        Set.of());
  }

  private void updateUiSchemaForType(
      JsonNode uiSchemaNode,
      String nodeName,
      Set<? extends BasePropertyDefinition> properties,
      Set<BasePropertyDefinition> readOnlyProperties,
      Set<BasePropertyDefinition> hiddenProperties) {
    addUiNodeForPropertySet(
        (ObjectNode) uiSchemaNode,
        properties,
        nodeName,
        ProductPackageType.PACKAGE,
        true,
        readOnlyProperties,
        hiddenProperties);
    JsonNode containedProductsNode = uiSchemaNode.get(CONTAINED_PRODUCTS);
    if (containedProductsNode != null && containedProductsNode.has(ITEMS)) {
      JsonNode itemsNode = containedProductsNode.get(ITEMS);
      if (itemsNode != null && itemsNode.has(PRODUCT_DETAILS)) {
        JsonNode productDetailsNode = itemsNode.get(PRODUCT_DETAILS);

        // Check for oneOf array
        if (productDetailsNode.has("oneOf") && productDetailsNode.get("oneOf").isArray()) {
          ArrayNode oneOfArray = (ArrayNode) productDetailsNode.get("oneOf");
          for (JsonNode oneOfMember : oneOfArray) {
            // Apply your logic to each member
            addUiNodeForPropertySet(
                (ObjectNode) oneOfMember,
                properties,
                nodeName,
                ProductPackageType.PRODUCT,
                true,
                readOnlyProperties,
                hiddenProperties);
          }
        } else {
          // Fallback to original logic
          addUiNodeForPropertySet(
              (ObjectNode) productDetailsNode,
              properties,
              nodeName,
              ProductPackageType.PRODUCT,
              true,
              readOnlyProperties,
              hiddenProperties);
        }
      }
    }
    addUiNodeForPropertySet(
        uiSchemaNode.withObjectProperty("containedPackages").withObjectProperty(ITEMS),
        properties,
        nodeName,
        ProductPackageType.PACKAGE,
        true,
        readOnlyProperties,
        hiddenProperties);

    addUiNodeForPropertySet(
        uiSchemaNode
            .withObjectProperty("containedPackages")
            .withObjectProperty(ITEMS)
            .withObjectProperty(PACKAGE_DETAILS),
        properties,
        nodeName,
        ProductPackageType.PACKAGE,
        true,
        readOnlyProperties,
        hiddenProperties);
    addUiNodeForPropertySet(
        uiSchemaNode
            .withObjectProperty("containedPackages")
            .withObjectProperty(ITEMS)
            .withObjectProperty(PACKAGE_DETAILS)
            .withObjectProperty(CONTAINED_PRODUCTS)
            .withObjectProperty(ITEMS)
            .withObjectProperty(PRODUCT_DETAILS),
        properties,
        nodeName,
        ProductPackageType.PRODUCT,
        true,
        readOnlyProperties,
        hiddenProperties);
  }

  private void addUiNodeForPropertySet(
      ObjectNode uiSchemaNode,
      Set<? extends BasePropertyDefinition> inputPropertySet,
      String nodeName,
      ProductPackageType productPackageType,
      boolean filterProductPackageType,
      Set<BasePropertyDefinition> readOnlyProperties,
      Set<BasePropertyDefinition> hiddenProperties) {

    List<? extends BasePropertyDefinition> filteredPropertySet =
        inputPropertySet.stream()
            .filter(m -> !filterProductPackageType || m.getLevel().equals(productPackageType))
            .sorted(
                Comparator.comparingInt(BasePropertyDefinition::getOrder)
                    .thenComparing(BasePropertyDefinition::getName))
            .toList();

    if (!filteredPropertySet.isEmpty()) {

      ObjectNode uiNode = objectMapper.createObjectNode();
      uiNode.put(
          UI_FIELD, "ExternalIdentifiers"); // todo change this name to something more generic
      ObjectNode uiOptions = getUiOptions(false);

      processNonDefiningPropertyBaseMembers(
          filteredPropertySet, uiOptions, readOnlyProperties, hiddenProperties);

      ArrayNode propertyOrder = objectMapper.createArrayNode();

      for (BasePropertyDefinition property : filteredPropertySet) {
        propertyOrder.add(property.getName());
      }

      uiOptions.set("propertyOrder", propertyOrder);

      uiNode.set(UI_OPTIONS, uiOptions);

      uiSchemaNode.set(nodeName, uiNode);

      uiSchemaNode.set(nodeName, uiNode);
    }
  }

  private void processNonDefiningPropertyBaseMembers(
      List<? extends BasePropertyDefinition> filteredPropertySet,
      ObjectNode uiOptions,
      Set<BasePropertyDefinition> readOnlyProperties,
      Set<BasePropertyDefinition> hiddenProperties) {
    ArrayNode mandatoryFields = objectMapper.createArrayNode();
    ArrayNode multiValuedFields = objectMapper.createArrayNode();
    ArrayNode showDefaultOptionsFields = objectMapper.createArrayNode();
    ArrayNode readOnlyFields = objectMapper.createArrayNode();
    ArrayNode hiddenFields = objectMapper.createArrayNode();
    ObjectNode bindingNode = objectMapper.createObjectNode();
    for (BasePropertyDefinition m : filteredPropertySet) {
      processNonDefiningPropertyBaseMember(
          m,
          mandatoryFields,
          multiValuedFields,
          bindingNode,
          readOnlyFields,
          hiddenFields,
          showDefaultOptionsFields,
          readOnlyProperties,
          hiddenProperties);
    }

    if (!mandatoryFields.isEmpty()) {
      uiOptions.set("mandatorySchemes", mandatoryFields);
    }

    // TODO: add here the createConceptSchemes
    if (!multiValuedFields.isEmpty()) {
      uiOptions.set("multiValuedSchemes", multiValuedFields);
    }
    if (!showDefaultOptionsFields.isEmpty()) {
      uiOptions.set("showDefaultOptionSchemes", showDefaultOptionsFields);
    }

    if (!bindingNode.isEmpty()) {
      uiOptions.set("binding", bindingNode);
    }

    if (!bindingNode.isEmpty()) {
      uiOptions.set("readOnlyProperties", readOnlyFields);
    }

    if (!hiddenFields.isEmpty()) {
      uiOptions.set("hiddenProperties", hiddenFields);
    }
  }

  private void processNonDefiningPropertyBaseMember(
      BasePropertyDefinition m,
      ArrayNode mandatoryFields,
      ArrayNode multiValuedFields,
      ObjectNode bindingNode,
      ArrayNode readOnlyFields,
      ArrayNode hiddenFields,
      ArrayNode showDefaultOptionsFields,
      Set<BasePropertyDefinition> readOnlyProperties,
      Set<BasePropertyDefinition> hiddenProperties) {
    if (m instanceof BasePropertyWithValueDefinition nonDefiningPropertyBase) {

      if (nonDefiningPropertyBase.isMandatory()) {
        mandatoryFields.add(nonDefiningPropertyBase.getName());
      }

      if (nonDefiningPropertyBase.isMultiValued()) {
        multiValuedFields.add(nonDefiningPropertyBase.getName());
      }
      if (nonDefiningPropertyBase.isShowDefaultOptions()) {
        showDefaultOptionsFields.add(nonDefiningPropertyBase.getName());
      }

      ObjectNode binding = (ObjectNode) bindingNode.get(m.getName());
      if (binding == null) {
        binding = objectMapper.createObjectNode();
        bindingNode.set(m.getName(), binding);
      }

      // Top-level properties
      if (nonDefiningPropertyBase.getValueSetReference() != null) {
        binding.set(
            "valueSet", objectMapper.valueToTree(nonDefiningPropertyBase.getValueSetReference()));
      }
      if (nonDefiningPropertyBase.getCodeSystem() != null) {
        binding.set(
            "codeSystem", objectMapper.valueToTree(nonDefiningPropertyBase.getCodeSystem()));
      }
      if (nonDefiningPropertyBase.getEclBinding() != null) {
        binding.set("ecl", objectMapper.valueToTree(nonDefiningPropertyBase.getEclBinding()));
      }
      if (nonDefiningPropertyBase.getCreateConceptPlaceholderText() != null) {
        binding.set(
            "placeholder",
            objectMapper.valueToTree(nonDefiningPropertyBase.getCreateConceptPlaceholderText()));
      }

      // Create concept nested object
      ObjectNode createConcept = null;
      if (nonDefiningPropertyBase.getCreateConceptEcl() != null) {
        if (createConcept == null) {
          createConcept = objectMapper.createObjectNode();
        }
        createConcept.set(
            "ecl", objectMapper.valueToTree(nonDefiningPropertyBase.getCreateConceptEcl()));
      }
      if (nonDefiningPropertyBase.getCreateConceptSemanticTag() != null) {
        if (createConcept == null) {
          createConcept = objectMapper.createObjectNode();
        }
        createConcept.set(
            "semanticTags",
            objectMapper.valueToTree(nonDefiningPropertyBase.getCreateConceptSemanticTag()));
      }
      if (nonDefiningPropertyBase.getCreateConceptPostfix() != null) {
        if (createConcept == null) {
          createConcept = objectMapper.createObjectNode();
        }
        createConcept.set(
            "postfix", objectMapper.valueToTree(nonDefiningPropertyBase.getCreateConceptPostfix()));
      }
      if (nonDefiningPropertyBase.getCreateConceptParentId() != null) {
        if (createConcept == null) {
          createConcept = objectMapper.createObjectNode();
        }
        createConcept.set(
            "parentConceptId",
            objectMapper.valueToTree(nonDefiningPropertyBase.getCreateConceptParentId()));
      }
      if (nonDefiningPropertyBase.getCreateConceptParentName() != null) {
        if (createConcept == null) {
          createConcept = objectMapper.createObjectNode();
        }
        createConcept.set(
            "parentConceptName",
            objectMapper.valueToTree(nonDefiningPropertyBase.getCreateConceptParentName()));
      }
      if (createConcept != null) {
        binding.set("createConcept", createConcept);
      }
    }

    if (m.isReadOnly() || readOnlyProperties.contains(m)) {
      readOnlyFields.add(m.getName());
    }

    if (m.isHidden() || hiddenProperties.contains(m)) {
      hiddenFields.add(m.getName());
    }
  }

  private ObjectNode getUiOptions(boolean title) {
    ObjectNode uiOptions = objectMapper.createObjectNode();
    uiOptions.put("label", title);
    uiOptions.put("skipTitle", !title);
    return uiOptions;
  }
}
