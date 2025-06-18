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

import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.product.details.properties.PropertyType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Migration to update Product.packageDetails JSON structure. This migration consolidates three
 * lists (externalIdentifiers, referenceSets, nonDefiningProperties) into one list
 * (nonDefiningProperties) of type NonDefiningBase.
 */
@SuppressWarnings("squid:S00101") // Class name matches Flyway migration naming convention
public class V1_28__ConsolidateNonDefiningProperties extends BaseJavaMigration {

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
  private static final Logger logger =
      LoggerFactory.getLogger(V1_28__ConsolidateNonDefiningProperties.class);
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

  @Override
  public void migrate(Context context) throws Exception {
    Connection connection = context.getConnection();

    // Get all products
    List<ProductRecord> products = getAllProducts(connection);
    logger.info("Found {} products to migrate", products.size());

    // Process each product
    for (ProductRecord product : products) {
      try {
        // Parse the JSON
        JsonNode packageDetails = objectMapper.readTree(product.packageDetails);
        JsonNode originalPackageDetails =
            product.originalPackageDetails != null
                ? objectMapper.readTree(product.originalPackageDetails)
                : null;

        // Update the JSON structure
        JsonNode updatedPackageDetails = updatePackageDetails(packageDetails);
        JsonNode updatedOriginalPackageDetails =
            originalPackageDetails != null ? updatePackageDetails(originalPackageDetails) : null;

        // Save the updated JSON back to the database
        updateProduct(
            connection,
            product.id,
            objectMapper.writeValueAsString(updatedPackageDetails),
            updatedOriginalPackageDetails != null
                ? objectMapper.writeValueAsString(updatedOriginalPackageDetails)
                : null);

        logger.info("Successfully migrated product with ID: {}", product.id);
      } catch (Exception e) {
        throw new LingoProblem("Error migrating product with ID:" + product.id, e);
      }
    }
  }

  private List<ProductRecord> getAllProducts(Connection connection) throws SQLException {
    List<ProductRecord> products = new ArrayList<>();

    try (PreparedStatement stmt =
        connection.prepareStatement(
            "SELECT id, package_details, original_package_details FROM product")) {
      try (ResultSet rs = stmt.executeQuery()) {
        while (rs.next()) {
          ProductRecord product = new ProductRecord();
          product.id = rs.getLong("id");
          product.packageDetails = rs.getString("package_details");
          product.originalPackageDetails = rs.getString("original_package_details");
          products.add(product);
        }
      }
    }

    return products;
  }

  private void updateProduct(
      Connection connection, long id, String packageDetails, String originalPackageDetails)
      throws SQLException {
    boolean isPostgres = connection.getMetaData().getDatabaseProductName().contains("PostgreSQL");

    // SQL for PostgreSQL vs H2
    String sql;
    if (isPostgres) {
      sql = "UPDATE product SET package_details = CAST(? AS json)";
      if (originalPackageDetails != null) {
        sql += ", original_package_details = CAST(? AS json)";
      }
    } else {
      // For H2, just use normal parameters
      sql = "UPDATE product SET package_details = ?";
      if (originalPackageDetails != null) {
        sql += ", original_package_details = ?";
      }
    }
    sql += " WHERE id = ?";

    try (PreparedStatement stmt = connection.prepareStatement(sql)) {
      stmt.setString(1, packageDetails);
      if (originalPackageDetails != null) {
        stmt.setString(2, originalPackageDetails);
        stmt.setLong(3, id);
      } else {
        stmt.setLong(2, id);
      }
      stmt.executeUpdate();
    }
  }

  private JsonNode updatePackageDetails(JsonNode packageDetails) {
    // Create a deep copy of the packageDetails to avoid modifying the original
    ObjectNode updatedPackageDetails = packageDetails.deepCopy();

    // Process the packageDetails directly
    processPackageDetailsNode(updatedPackageDetails);

    // Process any ProductDetails within containedProducts
    if (updatedPackageDetails.has(CONTAINED_PRODUCTS)
        && updatedPackageDetails.get(CONTAINED_PRODUCTS).isArray()) {
      ArrayNode containedProducts = (ArrayNode) updatedPackageDetails.get(CONTAINED_PRODUCTS);
      for (int i = 0; i < containedProducts.size(); i++) {
        JsonNode productQuantity = containedProducts.get(i);
        if (productQuantity.has(PRODUCT_DETAILS)) {
          ObjectNode productDetails = (ObjectNode) productQuantity.get(PRODUCT_DETAILS);
          processPackageDetailsNode(productDetails);
        }
      }
    }

    // Process any PackageDetails within containedPackages
    if (updatedPackageDetails.has(CONTAINED_PACKAGES)
        && updatedPackageDetails.get(CONTAINED_PACKAGES).isArray()) {
      ArrayNode containedPackages = (ArrayNode) updatedPackageDetails.get(CONTAINED_PACKAGES);
      for (int i = 0; i < containedPackages.size(); i++) {
        JsonNode packageQuantity = containedPackages.get(i);
        if (packageQuantity.has(PACKAGE_DETAILS)) {
          ObjectNode nestedPackageDetails = (ObjectNode) packageQuantity.get(PACKAGE_DETAILS);
          processPackageDetailsNode(nestedPackageDetails);
        }
      }
    }

    return updatedPackageDetails;
  }

  private void processPackageDetailsNode(ObjectNode node) {
    // Create a new consolidated array for nonDefiningProperties
    ArrayNode consolidatedProperties = objectMapper.createArrayNode();

    processExternalIdentifiers(node, consolidatedProperties);

    processReferenceSets(node, consolidatedProperties);

    processNonDefiningProperties(node, consolidatedProperties);

    // Add the consolidated properties back to the node
    node.set(NON_DEFINING_PROPERTIES, consolidatedProperties);
  }

  private static class ProductRecord {
    long id;
    String packageDetails;
    String originalPackageDetails;
  }
}
