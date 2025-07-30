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
import org.springframework.stereotype.Component;

@Component
public class UiSchemaExtender {

  public static final String ITEMS = "items";
  public static final String UI_OPTIONS = "ui:options";
  public static final String UI_WIDGET = "ui:widget";

  public static final String UI_FIELD = "ui:field";
  public static final String CONTAINED_PRODUCTS = "containedProducts";
  public static final String PRODUCT_DETAILS = "productDetails";
  private static final String PACKAGE_DETAILS = "packageDetails";

  ObjectMapper objectMapper;

  public UiSchemaExtender(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public void updateUiSchema(ModelConfiguration modelConfiguration, JsonNode uiSchemaNode,ProductType productType) {
    Set<BasePropertyDefinition> properties = new HashSet<>(modelConfiguration.getMappings());
    properties.addAll(modelConfiguration.getNonDefiningProperties());
    properties.addAll(modelConfiguration.getReferenceSets());
    properties.removeIf(p -> p.getSuppressOnProductTypes().contains(productType));

    updateUiSchemaForType(uiSchemaNode, NON_DEFINING_PROPERTIES, properties);
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
            : ProductPackageType.PRODUCT);
  }

  private void updateUiSchemaForType(
      JsonNode uiSchemaNode, String nodeName, Set<? extends BasePropertyDefinition> properties) {
    addUiNodeForPropertySet(
        (ObjectNode) uiSchemaNode, properties, nodeName, ProductPackageType.PACKAGE);
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
                (ObjectNode) oneOfMember, properties, nodeName, ProductPackageType.PRODUCT);
          }
        } else {
          // Fallback to original logic
          addUiNodeForPropertySet(
              (ObjectNode) productDetailsNode, properties, nodeName, ProductPackageType.PRODUCT);
        }
      }
    }
    addUiNodeForPropertySet(
        uiSchemaNode.withObjectProperty("containedPackages").withObjectProperty(ITEMS),
        properties,
        nodeName,
        ProductPackageType.CONTAINED_PACKAGE);
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
        ProductPackageType.PRODUCT);
  }

  private void addUiNodeForPropertySet(
      ObjectNode uiSchemaNode,
      Set<? extends BasePropertyDefinition> inputPropertySet,
      String nodeName,
      ProductPackageType productPackageType) {

    List<? extends BasePropertyDefinition> filteredPropertySet =
        inputPropertySet.stream()
            .filter(m -> m.getLevel().equals(productPackageType))
            .sorted(
                Comparator.comparingInt(BasePropertyDefinition::getOrder)
                    .thenComparing(BasePropertyDefinition::getName))
            .toList();

    if (!filteredPropertySet.isEmpty()) {

      ObjectNode uiNode = objectMapper.createObjectNode();
      uiNode.put(
          UI_FIELD, "ExternalIdentifiers"); // todo change this name to something more generic
      ObjectNode uiOptions = getUiOptions(false);

      processNonDefiningPropertyBaseMembers(filteredPropertySet, uiOptions);

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
      List<? extends BasePropertyDefinition> filteredPropertySet, ObjectNode uiOptions) {
    ArrayNode mandatoryFields = objectMapper.createArrayNode();
    ArrayNode multiValuedFields = objectMapper.createArrayNode();
    ArrayNode showDefaultOptionsFields = objectMapper.createArrayNode();
    ArrayNode readOnlyFields = objectMapper.createArrayNode();
    ObjectNode bindingNode = objectMapper.createObjectNode();
    for (BasePropertyDefinition m : filteredPropertySet) {
      processNonDefiningPropertyBaseMember(
          m,
          mandatoryFields,
          multiValuedFields,
          bindingNode,
          readOnlyFields,
          showDefaultOptionsFields);
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
  }

  private void processNonDefiningPropertyBaseMember(
      BasePropertyDefinition m,
      ArrayNode mandatoryFields,
      ArrayNode multiValuedFields,
      ObjectNode bindingNode,
      ArrayNode readOnlyFields,
      ArrayNode showDefaultOptionsFields) {
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

    if (m.isReadOnly()) {
      readOnlyFields.add(m.getName());
    }
  }

  private ObjectNode getUiOptions(boolean title) {
    ObjectNode uiOptions = objectMapper.createObjectNode();
    uiOptions.put("label", title);
    uiOptions.put("skipTitle", !title);
    return uiOptions;
  }
}
