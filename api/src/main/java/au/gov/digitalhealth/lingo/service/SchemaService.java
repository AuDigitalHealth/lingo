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
package au.gov.digitalhealth.lingo.service;

import au.gov.digitalhealth.lingo.configuration.model.MappingRefset;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ProductPackageType;
import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.service.schema.ArrayProperty;
import au.gov.digitalhealth.lingo.service.schema.ExternalIdentifierSchemaList;
import au.gov.digitalhealth.lingo.service.schema.IdentifierSchema;
import au.gov.digitalhealth.lingo.service.schema.ReferenceProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.util.ResourceUtils;

@Service
public class SchemaService {

  public static final String ITEMS = "items";
  public static final String UI_OPTIONS = "ui:options";
  public static final String UI_WIDGET = "ui:widget";
  private final Models models;
  private final ResourceLoader resourceLoader;
  private final ObjectMapper objectMapper;

  public SchemaService(Models models, ResourceLoader resourceLoader, ObjectMapper objectMapper) {
    this.models = models;
    this.resourceLoader = resourceLoader;
    this.objectMapper = objectMapper;
  }

  public String getMedicationSchema(String branch) {
    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);
    JsonNode schemaNode = readFileContentAsJson(modelConfiguration.getBaseMedicationSchema());

    updateSchemaForMappings(modelConfiguration, schemaNode);

    return schemaNode.toString();
  }

  public String getMedicationUiSchema(String branch) {
    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);
    JsonNode uiSchemaNode = readFileContentAsJson(modelConfiguration.getBaseMedicationUiSchema());

    updateUiSchemaForMappings(modelConfiguration, uiSchemaNode);

    return uiSchemaNode.toString();
  }

  private void updateUiSchemaForMappings(
      ModelConfiguration modelConfiguration, JsonNode uiSchemaNode) {
    ObjectNode packageItems =
        getUiSchemaForexternamIdenfiers(modelConfiguration, ProductPackageType.PACKAGE);
    if (packageItems != null) {
      ObjectNode root = (ObjectNode) uiSchemaNode;
      root.set("externalIdentifiers", packageItems);
    }

    ObjectNode productItems =
        getUiSchemaForexternamIdenfiers(modelConfiguration, ProductPackageType.PRODUCT);
    if (productItems != null) {
      uiSchemaNode
          .withObjectProperty("containedProducts")
          .withObjectProperty("items")
          .set("externalIdentifiers", productItems);
    }
  }

  private ObjectNode getUiSchemaForexternamIdenfiers(
      ModelConfiguration modelConfiguration, ProductPackageType productPackageType) {
    List<ObjectNode> externalIdentifiers =
        getExternalIdentifiers(modelConfiguration.getMappings(), productPackageType);

    ObjectNode packageItems = null;
    if (!externalIdentifiers.isEmpty()) {
      packageItems = objectMapper.createObjectNode();
      if (externalIdentifiers.size() == 1) {
        packageItems.set(ITEMS, externalIdentifiers.get(0));
      } else {
        packageItems.set(UI_OPTIONS, getUiOptions(false));

        ArrayNode oneOf = objectMapper.createArrayNode();
        for (ObjectNode externalIdentifier : externalIdentifiers) {
          oneOf.add(externalIdentifier);
        }

        packageItems.set("oneOf", oneOf);
      }
    }
    return packageItems;
  }

  private ObjectNode getUiOptions(boolean title) {
    ObjectNode uiOptions = objectMapper.createObjectNode();
    uiOptions.put("label", title);
    uiOptions.put("skipTitle", !title);
    return uiOptions;
  }

  private List<ObjectNode> getExternalIdentifiers(
      Set<MappingRefset> mappings, ProductPackageType level) {
    List<ObjectNode> externalIdentifiers = new ArrayList<>();
    for (MappingRefset mappingRefset :
        mappings.stream().filter(m -> m.getLevel().equals(level)).collect(Collectors.toSet())) {
      ObjectNode externalIdentifier = objectMapper.createObjectNode();

      ObjectNode externalIdentifierOptions = getUiOptions(true);
      externalIdentifierOptions.put("multiValued", mappingRefset.isMultiValued());
      externalIdentifierOptions.put("mandatory", mappingRefset.isMandatory());

      externalIdentifier.set(UI_OPTIONS, externalIdentifierOptions);

      ObjectNode identifierScheme = objectMapper.createObjectNode();
      identifierScheme.put(UI_WIDGET, "hidden");
      identifierScheme.set(UI_OPTIONS, getUiOptions(false));
      externalIdentifier.set("identifierScheme", identifierScheme);

      ObjectNode identifierValues = objectMapper.createObjectNode();
      identifierValues.set(UI_OPTIONS, getUiOptions(false));
      identifierValues.set(ITEMS, objectMapper.createObjectNode());
      identifierValues.put(UI_WIDGET, "text");
      externalIdentifier.set("identifierValue", identifierValues);

      ObjectNode relationshipType = objectMapper.createObjectNode();
      if (mappingRefset.getMappingTypes().size() == 1) {
        relationshipType.put(UI_WIDGET, "hidden");
      } else {
        relationshipType.put(UI_WIDGET, "select");
      }
      relationshipType.set(UI_OPTIONS, getUiOptions(false));
      externalIdentifier.set("relationshipType", relationshipType);

      externalIdentifiers.add(externalIdentifier);
    }
    return externalIdentifiers;
  }

  private void updateSchemaForMappings(ModelConfiguration modelConfiguration, JsonNode schemaNode) {
    Set<MappingRefset> mappings = modelConfiguration.getMappings();
    ArrayProperty externalPackageIdentifierProperty =
        getExternalIdentifierProperty(
            schemaNode, mappings, "PackageExternalIdentifier", ProductPackageType.PACKAGE);

    if (externalPackageIdentifierProperty != null) {
      schemaNode
          .withObjectProperty("properties")
          .set("externalIdentifiers", objectMapper.valueToTree(externalPackageIdentifierProperty));
    }

    ArrayProperty externalProductIdentifierProperty =
        getExternalIdentifierProperty(
            schemaNode, mappings, "ProdutExternalIdentifier", ProductPackageType.PRODUCT);

    if (externalProductIdentifierProperty != null) {
      schemaNode
          .withObjectProperty("$defs")
          .withObjectProperty("ProductDetails")
          .withObjectProperty("properties")
          .set("externalIdentifiers", objectMapper.valueToTree(externalProductIdentifierProperty));
    }
  }

  private ArrayProperty getExternalIdentifierProperty(
      JsonNode schemaNode,
      Set<MappingRefset> mappings,
      String jsonTypeName,
      ProductPackageType productPackageType) {
    Set<MappingRefset> packageMappings =
        mappings.stream()
            .filter(m -> m.getLevel().equals(productPackageType))
            .collect(Collectors.toSet());

    ArrayProperty externalIdentifierProperty = null;
    if (!packageMappings.isEmpty()) {
      if (packageMappings.size() == 1) {
        IdentifierSchema schema = IdentifierSchema.create(packageMappings.iterator().next());
        schemaNode.withObjectProperty("$defs").set(jsonTypeName, objectMapper.valueToTree(schema));
      } else {
        ExternalIdentifierSchemaList externalIdentifierSchema = new ExternalIdentifierSchemaList();
        packageMappings.forEach(
            mapping -> externalIdentifierSchema.getOneOf().add(IdentifierSchema.create(mapping)));

        schemaNode
            .withObjectProperty("$defs")
            .set(jsonTypeName, objectMapper.valueToTree(externalIdentifierSchema));
      }

      externalIdentifierProperty = new ArrayProperty();
      externalIdentifierProperty.setItems(new ReferenceProperty("#/$defs/" + jsonTypeName));
      externalIdentifierProperty.setTitle("External Identifiers");
    }
    return externalIdentifierProperty;
  }

  private JsonNode readFileContentAsJson(String filePath) {
    try {
      String content;
      if (ResourceUtils.isUrl(filePath)) {
        Resource resource = resourceLoader.getResource(filePath);
        content = new String(resource.getInputStream().readAllBytes(), Charset.defaultCharset());
      } else {
        File file = new File(filePath);
        content = Files.readString(file.toPath());
      }
      return objectMapper.readTree(content);
    } catch (IOException e) {
      throw new LingoProblem("Failed to read schema file from path " + filePath, e);
    }
  }
}
