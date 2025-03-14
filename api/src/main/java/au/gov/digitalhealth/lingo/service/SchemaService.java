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

import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.service.schema.SchemaExtender;
import au.gov.digitalhealth.lingo.service.schema.UiSchemaExtender;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.util.ResourceUtils;

@Service
public class SchemaService {
  private final Models models;
  private final ResourceLoader resourceLoader;
  private final UiSchemaExtender uiSchemaExtender;
  private final SchemaExtender schemaExtender;
  private final ObjectMapper objectMapper;

  public SchemaService(
      Models models,
      ResourceLoader resourceLoader,
      UiSchemaExtender uiSchemaExtender,
      SchemaExtender schemaExtender,
      ObjectMapper objectMapper) {
    this.models = models;
    this.resourceLoader = resourceLoader;
    this.uiSchemaExtender = uiSchemaExtender;
    this.schemaExtender = schemaExtender;
    this.objectMapper = objectMapper;
  }

  public String getMedicationSchema(String branch) {
    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);
    JsonNode schemaNode = readFileContentAsJson(modelConfiguration.getBaseMedicationSchema());

    schemaExtender.updateSchema(modelConfiguration, schemaNode);

    return schemaNode.toString();
  }

  public String getMedicationUiSchema(String branch) {
    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);
    JsonNode uiSchemaNode = readFileContentAsJson(modelConfiguration.getBaseMedicationUiSchema());

    uiSchemaExtender.updateUiSchema(modelConfiguration, uiSchemaNode);

    return uiSchemaNode.toString();
  }

  public String getDeviceSchema(String branch) {
    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);
    JsonNode schemaNode = readFileContentAsJson(modelConfiguration.getBaseDeviceSchema());

    schemaExtender.updateSchema(modelConfiguration, schemaNode);

    return schemaNode.toString();
  }
  public String getBulkBrandSchema(String branch) {
    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);
    JsonNode schemaNode = readFileContentAsJson(modelConfiguration.getBaseBulkBrandSchema());

    schemaExtender.updateSchema(modelConfiguration, schemaNode);

    return schemaNode.toString();
  }
  public String getBulkBrandUiSchema(String branch) {
    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);
    JsonNode uiSchemaNode = readFileContentAsJson(modelConfiguration.getBaseBulkBrandUiSchema());

    uiSchemaExtender.updateUiSchema(modelConfiguration, uiSchemaNode);

    return uiSchemaNode.toString();
  }

  public String getBulkPackSchema(String branch) {
    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);
    JsonNode schemaNode = readFileContentAsJson(modelConfiguration.getBaseBulkPackSchema());

    schemaExtender.updateSchema(modelConfiguration, schemaNode);

    return schemaNode.toString();
  }
  public String getBulkPackUiSchema(String branch) {
    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);
    JsonNode uiSchemaNode = readFileContentAsJson(modelConfiguration.getBaseBulkPackUiSchema());

    uiSchemaExtender.updateUiSchema(modelConfiguration, uiSchemaNode);

    return uiSchemaNode.toString();
  }

  public String getDeviceUiSchema(String branch) {
    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);
    JsonNode uiSchemaNode = readFileContentAsJson(modelConfiguration.getBaseDeviceUiSchema());

    uiSchemaExtender.updateUiSchema(modelConfiguration, uiSchemaNode);

    return uiSchemaNode.toString();
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
