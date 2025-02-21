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
  public static final String EXTERNAL_IDENTIFIERS = "externalIdentifiers";
  public static final String DEFS = "$defs";
  private final Models models;
  private final ResourceLoader resourceLoader;
  private final ObjectMapper objectMapper;

  public SchemaService(Models models, ResourceLoader resourceLoader, ObjectMapper objectMapper) {
    this.models = models;
    this.resourceLoader = resourceLoader;
    this.objectMapper = objectMapper;
  }

  private static Set<MappingRefset> getMappingRefsetsForType(
      ModelConfiguration modelConfiguration, ProductPackageType productPackageType) {
    return modelConfiguration.getMappings().stream()
        .filter(m -> m.getLevel().equals(productPackageType))
        .collect(Collectors.toSet());
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

    addUiSchemaForExternalIdentifiers(
        modelConfiguration, (ObjectNode) uiSchemaNode, ProductPackageType.PACKAGE);
    addUiSchemaForExternalIdentifiers(
        modelConfiguration,
        uiSchemaNode.withObjectProperty("containedProducts").withObjectProperty(ITEMS),
        ProductPackageType.PRODUCT);
  }

  private void addUiSchemaForExternalIdentifiers(
      ModelConfiguration modelConfiguration,
      ObjectNode uiSchemaNode,
      ProductPackageType productPackageType) {
    Set<MappingRefset> refsets = getMappingRefsetsForType(modelConfiguration, productPackageType);

    if (!refsets.isEmpty()) {
      ObjectNode externalIdentifiersUiNode = objectMapper.createObjectNode();
      externalIdentifiersUiNode.put(UI_WIDGET, "OneOfArrayWidget");
      ObjectNode uiOptions = getUiOptions(false);
      ArrayNode mandatoryFields = objectMapper.createArrayNode();
      refsets.stream()
          .filter(MappingRefset::isMandatory)
          .forEach(m -> mandatoryFields.add(m.getName()));
      uiOptions.set("mandatorySchemes", mandatoryFields);
      ArrayNode multiValuedFields = objectMapper.createArrayNode();
      refsets.stream()
          .filter(MappingRefset::isMultiValued)
          .forEach(m -> multiValuedFields.add(m.getName()));
      uiOptions.set("multiValuedSchemes", multiValuedFields);
      externalIdentifiersUiNode.set(UI_OPTIONS, uiOptions);

      uiSchemaNode.set(EXTERNAL_IDENTIFIERS, externalIdentifiersUiNode);
    }
  }

  private ObjectNode getUiOptions(boolean title) {
    ObjectNode uiOptions = objectMapper.createObjectNode();
    uiOptions.put("label", title);
    uiOptions.put("skipTitle", !title);
    return uiOptions;
  }

  private void updateSchemaForMappings(ModelConfiguration modelConfiguration, JsonNode schemaNode) {
    Set<MappingRefset> mappings = modelConfiguration.getMappings();
    ArrayProperty externalPackageIdentifierProperty =
        getExternalIdentifierProperty(
            schemaNode, mappings, "PackageExternalIdentifier", ProductPackageType.PACKAGE);

    if (externalPackageIdentifierProperty != null) {
      schemaNode
          .withObjectProperty("properties")
          .set(EXTERNAL_IDENTIFIERS, objectMapper.valueToTree(externalPackageIdentifierProperty));
    }

    ArrayProperty externalProductIdentifierProperty =
        getExternalIdentifierProperty(
            schemaNode, mappings, "ProdutExternalIdentifier", ProductPackageType.PRODUCT);

    if (externalProductIdentifierProperty != null) {
      schemaNode
          .withObjectProperty(DEFS)
          .withObjectProperty("ProductDetails")
          .withObjectProperty("properties")
          .set(EXTERNAL_IDENTIFIERS, objectMapper.valueToTree(externalProductIdentifierProperty));
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
      ExternalIdentifierSchemaList externalIdentifierSchema = new ExternalIdentifierSchemaList();
      packageMappings.forEach(
          mapping -> externalIdentifierSchema.getOneOf().add(IdentifierSchema.create(mapping)));

      schemaNode
          .withObjectProperty(DEFS)
          .set(jsonTypeName, objectMapper.valueToTree(externalIdentifierSchema));

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
