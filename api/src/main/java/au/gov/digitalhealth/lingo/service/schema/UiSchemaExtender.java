package au.gov.digitalhealth.lingo.service.schema;

import static au.gov.digitalhealth.lingo.service.schema.SchemaConstants.EXTERNAL_IDENTIFIERS;
import static au.gov.digitalhealth.lingo.service.schema.SchemaConstants.NON_DEFINING_PROPERTIES;
import static au.gov.digitalhealth.lingo.service.schema.SchemaConstants.REFERENCE_SETS;

import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.NonDefiningBase;
import au.gov.digitalhealth.lingo.configuration.model.NonDefiningPropertyBase;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class UiSchemaExtender {

  public static final String ITEMS = "items";
  public static final String UI_OPTIONS = "ui:options";
  public static final String UI_WIDGET = "ui:widget";
  public static final String CONTAINED_PRODUCTS = "containedProducts";

  ObjectMapper objectMapper;

  public UiSchemaExtender(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  private static void insertNodeInUiOrder(ObjectNode uiSchemaNode, String propertyName) {
    ArrayNode uiOrderArray = uiSchemaNode.withArray("ui:order");
    int index = -1;
    for (int i = 0; i < uiOrderArray.size(); i++) {
      if (CONTAINED_PRODUCTS.equals(uiOrderArray.get(i).asText())
          || "activeIngredients".equals(uiOrderArray.get(i).asText())) {
        index = i;
        break;
      }
    }
    if (index != -1) {
      uiOrderArray.insert(index, propertyName);
    } else {
      uiOrderArray.add(propertyName);
    }
  }

  public void updateUiSchema(ModelConfiguration modelConfiguration, JsonNode uiSchemaNode) {

    updateUiSchemaForType(uiSchemaNode, EXTERNAL_IDENTIFIERS, modelConfiguration.getMappings());
    updateUiSchemaForType(
        uiSchemaNode, NON_DEFINING_PROPERTIES, modelConfiguration.getNonDefiningProperties());
    updateUiSchemaForType(uiSchemaNode, REFERENCE_SETS, modelConfiguration.getReferenceSets());
  }

  private void updateUiSchemaForType(
      JsonNode uiSchemaNode, String nodeName, Set<? extends NonDefiningBase> properties) {
    addUiNodeForPropertySet(
        (ObjectNode) uiSchemaNode, properties, nodeName, ProductPackageType.PACKAGE);
    addUiNodeForPropertySet(
        uiSchemaNode.withObjectProperty(CONTAINED_PRODUCTS).withObjectProperty(ITEMS),
        properties,
        nodeName,
        ProductPackageType.PRODUCT);
    addUiNodeForPropertySet(
        uiSchemaNode.withObjectProperty("containedPackages").withObjectProperty(ITEMS),
        properties,
        nodeName,
        ProductPackageType.CONTAINED_PACKAGE);
    addUiNodeForPropertySet(
        uiSchemaNode
            .withObjectProperty("containedPackages")
            .withObjectProperty(ITEMS)
            .withObjectProperty(CONTAINED_PRODUCTS)
            .withObjectProperty(ITEMS),
        properties,
        nodeName,
        ProductPackageType.PRODUCT);
  }

  private void addUiNodeForPropertySet(
      ObjectNode uiSchemaNode,
      Set<? extends NonDefiningBase> inputPropertySet,
      String nodeName,
      ProductPackageType productPackageType) {

    Set<? extends NonDefiningBase> filteredPropertySet =
        inputPropertySet.stream()
            .filter(m -> m.getLevel().equals(productPackageType))
            .collect(Collectors.toSet());

    if (!filteredPropertySet.isEmpty()) {

      ObjectNode uiNode = objectMapper.createObjectNode();
      uiNode.put(UI_WIDGET, "OneOfArrayWidget");
      ObjectNode uiOptions = getUiOptions(false);

      processNonDefiningPropertyBaseMembers(filteredPropertySet, uiOptions);

      uiNode.set(UI_OPTIONS, uiOptions);

      uiSchemaNode.set(nodeName, uiNode);

      insertNodeInUiOrder(uiSchemaNode, nodeName);
      uiSchemaNode.set(nodeName, uiNode);
    }
  }

  private void processNonDefiningPropertyBaseMembers(
      Set<? extends NonDefiningBase> filteredPropertySet, ObjectNode uiOptions) {
    ArrayNode mandatoryFields = objectMapper.createArrayNode();
    ArrayNode multiValuedFields = objectMapper.createArrayNode();
    ObjectNode bindingNode = objectMapper.createObjectNode();
    for (NonDefiningBase m : filteredPropertySet) {
      processNonDefiningPropertyBaseMember(m, mandatoryFields, multiValuedFields, bindingNode);
    }

    if (!mandatoryFields.isEmpty()) {
      uiOptions.set("mandatorySchemes", mandatoryFields);
    }

    if (!multiValuedFields.isEmpty()) {
      uiOptions.set("multiValuedSchemes", multiValuedFields);
    }

    if (!bindingNode.isEmpty()) {
      uiOptions.set("binding", bindingNode);
    }
  }

  private void processNonDefiningPropertyBaseMember(
      NonDefiningBase m,
      ArrayNode mandatoryFields,
      ArrayNode multiValuedFields,
      ObjectNode bindingNode) {
    if (m instanceof NonDefiningPropertyBase nonDefiningPropertyBase) {

      if (nonDefiningPropertyBase.isMandatory()) {
        mandatoryFields.add(nonDefiningPropertyBase.getName());
      }

      if (nonDefiningPropertyBase.isMultiValued()) {
        multiValuedFields.add(nonDefiningPropertyBase.getName());
      }

      if (nonDefiningPropertyBase.getValueSetReference() != null) {
        ObjectNode binding = objectMapper.createObjectNode();
        binding.set(
            "valueSet", objectMapper.valueToTree(nonDefiningPropertyBase.getValueSetReference()));
        bindingNode.set(m.getName(), binding);
      } else if (nonDefiningPropertyBase.getEclBinding() != null) {
        ObjectNode binding = objectMapper.createObjectNode();
        binding.set("ecl", objectMapper.valueToTree(nonDefiningPropertyBase.getEclBinding()));
        bindingNode.set(m.getName(), binding);
      }
    }
  }

  private ObjectNode getUiOptions(boolean title) {
    ObjectNode uiOptions = objectMapper.createObjectNode();
    uiOptions.put("label", title);
    uiOptions.put("skipTitle", !title);
    return uiOptions;
  }
}
