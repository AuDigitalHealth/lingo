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

import au.gov.digitalhealth.lingo.product.details.properties.PropertyType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.java.Log;

/**
 * Migration to transform externalIdentifiers in bulk product details from the old format to the new
 * nonDefiningProperties format with PropertyType.EXTERNAL_IDENTIFIER.
 */
@Log
@SuppressWarnings("squid:S00101") // Class name matches Flyway migration naming convention
public class V1_33__TransformExternalIdentifiersInBulkProducts extends BaseBulkProductMigration {

  private static final ObjectMapper objectMapper = new ObjectMapper();
  private static final String BRANDS = "brands";
  private static final String PACK_SIZES = "packSizes";
  private static final String UPDATED_STATE = "updatedState";
  private static final String HISTORIC_STATE = "historicState";
  private static final String EXTERNAL_IDENTIFIERS = "externalIdentifiers";
  private static final String NON_DEFINING_PROPERTIES = "nonDefiningProperties";
  private static final String IDENTIFIER_VALUE = "identifierValue";
  private static final String IDENTIFIER_SCHEME = "identifierScheme";
  private static final String TYPE = "type";
  private static final String TITLE = "title";
  private static final String VALUE = "value";
  private static final String IDENTIFIER = "identifier";
  private static final String DESCRIPTION = "description";
  private static final String ADDITIONAL_FIELDS = "additionalFields";
  private static final String RELATIONSHIP_TYPE = "relationshipType";
  private static final String ID = "id";
  private static final String MODULE_ID = "moduleId";
  private static final String ACTIVE = "active";
  private static final String ID_AND_FSN_TERM = "idAndFsnTerm";
  private static final String EFFECTIVE_TIME = "effectiveTime";
  private static final String DESCENDANT_COUNT = "descendantCount";
  private static final String DEFINITION_STATUS_ID = "definitionStatusId";

  protected void processNode(ObjectNode bulkDetails) {
    // Process brands if they exist
    if (bulkDetails.has(BRANDS) && bulkDetails.get(BRANDS).isObject()) {
      ObjectNode brandsNode = (ObjectNode) bulkDetails.get(BRANDS);

      if (brandsNode.has(BRANDS) && brandsNode.get(BRANDS).isArray()) {
        ArrayNode brandsArray = (ArrayNode) brandsNode.get(BRANDS);

        for (int i = 0; i < brandsArray.size(); i++) {
          if (brandsArray.get(i).isObject()) {
            ObjectNode brandItem = (ObjectNode) brandsArray.get(i);
            processBrandItem(brandItem);
          }
        }
      }
    }

    // Process packSizes if they exist
    if (bulkDetails.has(PACK_SIZES) && bulkDetails.get(PACK_SIZES).isObject()) {
      ObjectNode packSizesNode = (ObjectNode) bulkDetails.get(PACK_SIZES);

      if (packSizesNode.has(PACK_SIZES) && packSizesNode.get(PACK_SIZES).isArray()) {
        ArrayNode packSizesArray = (ArrayNode) packSizesNode.get(PACK_SIZES);

        for (int i = 0; i < packSizesArray.size(); i++) {
          if (packSizesArray.get(i).isObject()) {
            ObjectNode packSizeItem = (ObjectNode) packSizesArray.get(i);
            processPackSizeItem(packSizeItem);
          }
        }
      }
    }

    // Process product-update type with updatedState and historicState
    if (bulkDetails.has(UPDATED_STATE)) {
      ObjectNode updatedState = (ObjectNode) bulkDetails.get(UPDATED_STATE);
      processProductUpdateState(updatedState);
    }

    if (bulkDetails.has(HISTORIC_STATE)) {
      ObjectNode historicState = (ObjectNode) bulkDetails.get(HISTORIC_STATE);
      processProductUpdateState(historicState);
    }
  }

  private void processBrandItem(ObjectNode brandItem) {
    transformExternalIdentifiersToNonDefining(brandItem);
  }

  private void processPackSizeItem(ObjectNode packSizeItem) {
    transformExternalIdentifiersToNonDefining(packSizeItem);
  }

  private void transformExternalIdentifiersToNonDefining(ObjectNode item) {
    if (item.has(EXTERNAL_IDENTIFIERS) && item.get(EXTERNAL_IDENTIFIERS).isArray()) {
      ArrayNode externalIdentifiers = (ArrayNode) item.get(EXTERNAL_IDENTIFIERS);
      ArrayNode nonDefiningProperties = objectMapper.createArrayNode();

      for (int j = 0; j < externalIdentifiers.size(); j++) {
        if (externalIdentifiers.get(j).isObject()) {
          ObjectNode externalId = (ObjectNode) externalIdentifiers.get(j);
          ObjectNode transformedProperty = transformExternalIdentifier(externalId);
          nonDefiningProperties.add(transformedProperty);
        }
      }

      // Replace externalIdentifiers with nonDefiningProperties
      item.remove(EXTERNAL_IDENTIFIERS);
      item.set(NON_DEFINING_PROPERTIES, nonDefiningProperties);
    }
  }

  private void processProductUpdateState(ObjectNode state) {
    transformExternalIdentifiersToNonDefining(state);
  }

  private ObjectNode transformExternalIdentifier(ObjectNode externalId) {
    ObjectNode transformed = objectMapper.createObjectNode();

    // Set the type to EXTERNAL_IDENTIFIER
    transformed.put(TYPE, PropertyType.EXTERNAL_IDENTIFIER.name());

    // Map identifierScheme to title and identifierScheme
    if (externalId.has(IDENTIFIER_SCHEME)) {
      String scheme = externalId.get(IDENTIFIER_SCHEME).asText();

      // Extract scheme name from URL if it's a URL, otherwise use as-is
      String schemeName = extractSchemeFromUrl(scheme);

      // Set title based on scheme
      String title = mapSchemeToTitle(schemeName);
      transformed.put(TITLE, title);
      transformed.put(IDENTIFIER_SCHEME, schemeName);

      // Set description based on scheme
      String description = mapSchemeToDescription(schemeName);
      transformed.put(DESCRIPTION, description);
    }

    // Map identifierValue to value
    if (externalId.has(IDENTIFIER_VALUE)) {
      transformed.put(VALUE, externalId.get(IDENTIFIER_VALUE).asText());
    }

    // Set default values based on the target format
    transformed.put(IDENTIFIER, "11000168105"); // This seems to be a fixed value in your example
    transformed.set(ADDITIONAL_FIELDS, objectMapper.createObjectNode());
    transformed.put(RELATIONSHIP_TYPE, "RELATED");

    return transformed;
  }

  private String extractSchemeFromUrl(String scheme) {
    if (scheme != null && scheme.contains("/")) {
      // Extract the last part of the URL
      String[] parts = scheme.split("/");
      return parts[parts.length - 1];
    }
    return scheme;
  }

  private String mapSchemeToTitle(String scheme) {
    if ("artg".equalsIgnoreCase(scheme)) {
      return "ARTGID";
    }
    // should never be hit
    return scheme != null ? scheme.toUpperCase() : "UNKNOWN";
  }

  private String mapSchemeToDescription(String scheme) {
    if ("artg".equalsIgnoreCase(scheme)) {
      return "Australian Register of Therapeutic Goods Identifier";
    }
    // should never be hit
    return "External identifier for " + scheme;
  }
}
