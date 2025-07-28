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
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.java.Log;

/**
 * Migration to update Product.packageDetails JSON structure. This migration consolidates three
 * lists (externalIdentifiers, referenceSets, nonDefiningProperties) into one list
 * (nonDefiningProperties) of type NonDefiningBase.
 */
@Log
@SuppressWarnings("squid:S00101") // Class name matches Flyway migration naming convention
public class V1_28__ConsolidateNonDefiningProperties extends BaseProductMigration {

  public static final String CONTAINED_PRODUCTS = "containedProducts";
  public static final String PRODUCT_DETAILS = "productDetails";
  public static final String CONTAINED_PACKAGES = "containedPackages";
  public static final String PACKAGE_DETAILS = "packageDetails";
  public static final String EXTERNAL_IDENTIFIERS = "externalIdentifiers";
  public static final String IDENTIFIER_VALUE = "identifierValue";
  public static final String VALUE_OBJECT = "valueObject";
  public static final String IDENTIFIER_VALUE_OBJECT = "identifierValueObject";
  public static final String REFERENCE_SETS = "referenceSets";
  public static final String NON_DEFINING_PROPERTIES = "nonDefiningProperties";
  public static final String IDENTIFIER_SCHEME = "identifierScheme";
  public static final String VALUE = "value";
  public static final String TYPE = "type";
  private static final ObjectMapper objectMapper = new ObjectMapper();

  private static void processExternalIdentifiers(
      ObjectNode node, ArrayNode consolidatedProperties) {
    // Process externalIdentifiers
    if (node.has(EXTERNAL_IDENTIFIERS) && node.get(EXTERNAL_IDENTIFIERS).isArray()) {
      ArrayNode externalIdentifiers = (ArrayNode) node.get(EXTERNAL_IDENTIFIERS);
      for (int i = 0; i < externalIdentifiers.size(); i++) {
        processExternalIdentifier(consolidatedProperties, externalIdentifiers, i);
      }
      node.remove(EXTERNAL_IDENTIFIERS);
    }
  }

  private static void processExternalIdentifier(
      ArrayNode consolidatedProperties, ArrayNode externalIdentifiers, int i) {
    ObjectNode externalIdentifier = (ObjectNode) externalIdentifiers.get(i);
    if (externalIdentifier.has(IDENTIFIER_VALUE)) {
      JsonNode valueNode = externalIdentifier.get(IDENTIFIER_VALUE);
      if (externalIdentifier.get(IDENTIFIER_SCHEME).asText().equals("atc")
          || externalIdentifier.get(IDENTIFIER_SCHEME).asText().equals("pcrs")) {
        String conceptId = valueNode.asText();
        // Create the valueObject structure as a SnowstormConceptMini
        ObjectNode conceptMini = objectMapper.createObjectNode();
        conceptMini.put("conceptId", conceptId);
        conceptMini.put("id", conceptId);

        // Create fsn and pt terms
        ObjectNode fsn = objectMapper.createObjectNode();
        fsn.put("lang", "en");
        fsn.put("term", conceptId);
        conceptMini.set("fsn", fsn);

        ObjectNode pt = objectMapper.createObjectNode();
        pt.put("lang", "en");
        pt.put("term", conceptId);
        conceptMini.set("pt", pt);

        // Set the valueObject to our newly created SnowstormConceptMini
        externalIdentifier.set(VALUE_OBJECT, conceptMini);

      } else {
        externalIdentifier.set(VALUE, valueNode);
      }
      externalIdentifier.remove(IDENTIFIER_VALUE);
    }

    if (externalIdentifier.has(IDENTIFIER_VALUE_OBJECT)) {
      JsonNode valueObjectNode = externalIdentifier.get(IDENTIFIER_VALUE_OBJECT);
      if (!externalIdentifier.get(IDENTIFIER_VALUE_OBJECT).isNull()) {
        externalIdentifier.set(VALUE_OBJECT, valueObjectNode);
      }
      externalIdentifier.remove(IDENTIFIER_VALUE_OBJECT);
    }

    if (!externalIdentifier.has(TYPE)) {
      externalIdentifier.put(TYPE, PropertyType.EXTERNAL_IDENTIFIER.name());
    }
    consolidatedProperties.add(externalIdentifier);
  }

  private static void processReferenceSets(ObjectNode node, ArrayNode consolidatedProperties) {
    // Process referenceSets
    if (node.has(REFERENCE_SETS) && node.get(REFERENCE_SETS).isArray()) {
      ArrayNode referenceSets = (ArrayNode) node.get(REFERENCE_SETS);
      for (int i = 0; i < referenceSets.size(); i++) {
        ObjectNode referenceSet = (ObjectNode) referenceSets.get(i);

        if (!referenceSet.has(TYPE)) {
          referenceSet.put(TYPE, PropertyType.REFERENCE_SET.name());
        }
        consolidatedProperties.add(referenceSet);
      }
      node.remove(REFERENCE_SETS);
    }
  }

  private static void processNonDefiningProperties(
      ObjectNode node, ArrayNode consolidatedProperties) {
    // Process existing nonDefiningProperties
    if (node.has(NON_DEFINING_PROPERTIES) && node.get(NON_DEFINING_PROPERTIES).isArray()) {
      ArrayNode nonDefiningProperties = (ArrayNode) node.get(NON_DEFINING_PROPERTIES);
      for (int i = 0; i < nonDefiningProperties.size(); i++) {
        ObjectNode nonDefiningProperty = (ObjectNode) nonDefiningProperties.get(i);
        if (nonDefiningProperty.has(IDENTIFIER_VALUE)) {
          JsonNode valueNode = nonDefiningProperty.get(IDENTIFIER_VALUE);
          nonDefiningProperty.set(VALUE, valueNode);
          nonDefiningProperty.remove(IDENTIFIER_VALUE);
        }

        if (nonDefiningProperty.has(IDENTIFIER_VALUE_OBJECT)) {
          JsonNode valueObjectNode = nonDefiningProperty.get(IDENTIFIER_VALUE_OBJECT);
          nonDefiningProperty.set(VALUE_OBJECT, valueObjectNode);
          nonDefiningProperty.remove(IDENTIFIER_VALUE_OBJECT);
        }

        if (!nonDefiningProperty.has(TYPE)) {
          nonDefiningProperty.put(TYPE, PropertyType.NON_DEFINING_PROPERTY.name());
        }
        consolidatedProperties.add(nonDefiningProperty);
      }
      node.remove(NON_DEFINING_PROPERTIES);
    }
  }

  protected void processNode(ObjectNode node) {
    // Create a new consolidated array for nonDefiningProperties
    ArrayNode consolidatedProperties = objectMapper.createArrayNode();

    processExternalIdentifiers(node, consolidatedProperties);

    processReferenceSets(node, consolidatedProperties);

    processNonDefiningProperties(node, consolidatedProperties);

    // Add the consolidated properties back to the node
    node.set(NON_DEFINING_PROPERTIES, consolidatedProperties);
  }
}
