package au.gov.digitalhealth.lingo.service;

import au.gov.digitalhealth.lingo.configuration.model.MappingRefset;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.Models;
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
    List<ObjectNode> externalIdentifiers = getExternalIdentifiers(modelConfiguration.getMappings());

    if (!externalIdentifiers.isEmpty()) {
      ObjectNode items = objectMapper.createObjectNode();
      if (externalIdentifiers.size() == 1) {
        items.set(ITEMS, externalIdentifiers.get(0));
      } else {
        items.set(UI_OPTIONS, getUiOptions());

        ArrayNode oneOf = objectMapper.createArrayNode();
        for (ObjectNode externalIdentifier : externalIdentifiers) {
          oneOf.add(externalIdentifier);
        }

        items.set("oneOf", oneOf);
      }

      ObjectNode root = (ObjectNode) uiSchemaNode;
      root.set("externalIdentifiers", items);
    }
  }

  private ObjectNode getUiOptions() {
    ObjectNode uiOptions = objectMapper.createObjectNode();
    uiOptions.put("label", false);
    uiOptions.put("skipTitle", true);
    return uiOptions;
  }

  private List<ObjectNode> getExternalIdentifiers(List<MappingRefset> mappings) {
    List<ObjectNode> externalIdentifiers = new ArrayList<>();
    for (MappingRefset mappingRefset : mappings) {
      ObjectNode externalIdentifier = objectMapper.createObjectNode();

      ObjectNode identifierScheme = objectMapper.createObjectNode();
      identifierScheme.put(UI_WIDGET, "hidden");
      identifierScheme.set("uiL:options", getUiOptions());
      externalIdentifier.set("identifierScheme", identifierScheme);

      ObjectNode identifierValues = objectMapper.createObjectNode();
      identifierValues.set(UI_OPTIONS, getUiOptions());
      identifierValues.set(ITEMS, objectMapper.createObjectNode());
      String identifierValuePropertyName;
      if (mappingRefset.isMultiValued()) {
        identifierValues.set(ITEMS, objectMapper.createObjectNode());
        identifierValuePropertyName = "identifierValues";
      } else {
        identifierValues.put(UI_WIDGET, "text");
        identifierValuePropertyName = "identifierValue";
      }
      externalIdentifier.set(identifierValuePropertyName, identifierValues);

      ObjectNode relationshipType = objectMapper.createObjectNode();
      if (mappingRefset.getMappingTypes().size() == 1) {
        relationshipType.put(UI_WIDGET, "hidden");
      } else {
        relationshipType.put(UI_WIDGET, "select");
      }
      relationshipType.set(UI_OPTIONS, getUiOptions());
      externalIdentifier.set("relationshipType", relationshipType);

      externalIdentifiers.add(externalIdentifier);
    }
    return externalIdentifiers;
  }

  private void updateSchemaForMappings(ModelConfiguration modelConfiguration, JsonNode schemaNode) {
    List<MappingRefset> mappings = modelConfiguration.getMappings();
    if (!mappings.isEmpty()) {
      if (mappings.size() == 1) {
        IdentifierSchema schema = IdentifierSchema.create(mappings.get(0));
        schemaNode
            .withObjectProperty("$defs")
            .set("ExternalIdentifier", objectMapper.valueToTree(schema));
      } else {
        ExternalIdentifierSchemaList externalIdentifierSchema = new ExternalIdentifierSchemaList();
        mappings.forEach(
            mapping -> externalIdentifierSchema.getOneOf().add(IdentifierSchema.create(mapping)));

        schemaNode
            .withObjectProperty("$defs")
            .set("ExternalIdentifiers", objectMapper.valueToTree(externalIdentifierSchema));
      }

      ArrayProperty externalIdentifierProperty = new ArrayProperty();
      externalIdentifierProperty.setItems(new ReferenceProperty("#/$defs/ExternalIdentifier"));
      externalIdentifierProperty.setTitle("External Identifiers");
      schemaNode
          .withObjectProperty("properties")
          .set("externalIdentifiers", objectMapper.valueToTree(externalIdentifierProperty));
    }
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
