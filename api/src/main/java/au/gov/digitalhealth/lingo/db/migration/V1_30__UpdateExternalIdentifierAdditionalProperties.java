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
package au.gov.digitalhealth.lingo.db.migration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Iterator;
import java.util.Map;
import java.util.Map.Entry;
import lombok.extern.java.Log;

/**
 * Migration to update the JSON structure of additionalProperties fields from a Map<String, String>
 * format to a Set<AdditionalProperty> format.
 */
@Log
@SuppressWarnings("squid:S00101")
public class V1_30__UpdateExternalIdentifierAdditionalProperties extends BaseProductMigration {

  private static final ObjectMapper objectMapper = new ObjectMapper();
  private static final String NON_DEFINING_PROPERTIES = "nonDefiningProperties";
  private static final String ADDITIONAL_PROPERTIES = "additionalProperties";
  private static final String CODE = "code";
  private static final String CODE_SYSTEM = "codeSystem";
  private static final String VALUE = "value";

  protected void processNode(ObjectNode node) {
    // Process nonDefiningProperties which may contain objects with additionalProperties
    if (node.has(NON_DEFINING_PROPERTIES) && node.get(NON_DEFINING_PROPERTIES).isArray()) {
      ArrayNode nonDefiningProps = (ArrayNode) node.get(NON_DEFINING_PROPERTIES);
      for (int i = 0; i < nonDefiningProps.size(); i++) {
        if (nonDefiningProps.get(i).isObject()) {
          ObjectNode property = (ObjectNode) nonDefiningProps.get(i);
          transformAdditionalProperties(property);
        }
      }
    }
  }

  private void transformAdditionalProperties(ObjectNode node) {
    if (node.has(ADDITIONAL_PROPERTIES)) {
      JsonNode additionalProps = node.get(ADDITIONAL_PROPERTIES);

      // Check if it's already in the new format (array of objects)
      if (additionalProps.isArray()) {
        // Already in the correct format, do nothing
        return;
      }

      // If it's an object (old Map<String, String> format), transform it
      if (additionalProps.isObject()) {
        ArrayNode newAdditionalProps = objectMapper.createArrayNode();

        // Convert each key-value pair to an AdditionalProperty
        Iterator<Entry<String, JsonNode>> fields = additionalProps.fields();
        while (fields.hasNext()) {
          Map.Entry<String, JsonNode> entry = fields.next();
          String key = entry.getKey();
          String value = entry.getValue().asText();

          ObjectNode newProp = objectMapper.createObjectNode();
          newProp.put(CODE, key);
          newProp.put(CODE_SYSTEM, (String) null); // Set to null as per the record structure
          newProp.put(VALUE, value);
          newAdditionalProps.add(newProp);
        }

        // Replace the old format with the new format
        node.set(ADDITIONAL_PROPERTIES, newAdditionalProps);
      }
    }
  }
}
