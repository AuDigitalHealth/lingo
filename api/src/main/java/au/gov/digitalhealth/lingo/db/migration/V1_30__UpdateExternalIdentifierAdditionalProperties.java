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
