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
public class V1_28__ConsolidateNonDefiningProperties extends BaseJavaMigration {

  private static final Logger logger =
      LoggerFactory.getLogger(V1_28__ConsolidateNonDefiningProperties.class);
  private static final ObjectMapper objectMapper = new ObjectMapper();

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
        logger.error("Error migrating product with ID: {}", product.id, e);
        throw e;
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
    if (updatedPackageDetails.has("containedProducts")
        && updatedPackageDetails.get("containedProducts").isArray()) {
      ArrayNode containedProducts = (ArrayNode) updatedPackageDetails.get("containedProducts");
      for (int i = 0; i < containedProducts.size(); i++) {
        JsonNode productQuantity = containedProducts.get(i);
        if (productQuantity.has("productDetails")) {
          ObjectNode productDetails = (ObjectNode) productQuantity.get("productDetails");
          processPackageDetailsNode(productDetails);
        }
      }
    }

    // Process any PackageDetails within containedPackages
    if (updatedPackageDetails.has("containedPackages")
        && updatedPackageDetails.get("containedPackages").isArray()) {
      ArrayNode containedPackages = (ArrayNode) updatedPackageDetails.get("containedPackages");
      for (int i = 0; i < containedPackages.size(); i++) {
        JsonNode packageQuantity = containedPackages.get(i);
        if (packageQuantity.has("packageDetails")) {
          ObjectNode nestedPackageDetails = (ObjectNode) packageQuantity.get("packageDetails");
          processPackageDetailsNode(nestedPackageDetails);
        }
      }
    }

    return updatedPackageDetails;
  }

  private void processPackageDetailsNode(ObjectNode node) {
    // Create a new consolidated array for nonDefiningProperties
    ArrayNode consolidatedProperties = objectMapper.createArrayNode();

    // Process externalIdentifiers
    if (node.has("externalIdentifiers") && node.get("externalIdentifiers").isArray()) {
      ArrayNode externalIdentifiers = (ArrayNode) node.get("externalIdentifiers");
      for (int i = 0; i < externalIdentifiers.size(); i++) {
        ObjectNode externalIdentifier = (ObjectNode) externalIdentifiers.get(i);
        if (externalIdentifier.has("identifierValue")) {
          JsonNode valueNode = externalIdentifier.get("identifierValue");
          externalIdentifier.set("value", valueNode);
          externalIdentifier.remove("identifierValue");
        }

        if (externalIdentifier.has("identifierValueObject")) {
          JsonNode valueObjectNode = externalIdentifier.get("identifierValueObject");
          externalIdentifier.set("valueObject", valueObjectNode);
          externalIdentifier.remove("identifierValueObject");
        }

        externalIdentifier.put("type", PropertyType.EXTERNAL_IDENTIFIER.name());
        consolidatedProperties.add(externalIdentifier);
      }
      node.remove("externalIdentifiers");
    }

    // Process referenceSets
    if (node.has("referenceSets") && node.get("referenceSets").isArray()) {
      ArrayNode referenceSets = (ArrayNode) node.get("referenceSets");
      for (int i = 0; i < referenceSets.size(); i++) {
        ObjectNode referenceSet = (ObjectNode) referenceSets.get(i);
        referenceSet.put("type", PropertyType.REFERENCE_SET.name());
        consolidatedProperties.add(referenceSet);
      }
      node.remove("referenceSets");
    }

    // Process existing nonDefiningProperties
    if (node.has("nonDefiningProperties") && node.get("nonDefiningProperties").isArray()) {
      ArrayNode nonDefiningProperties = (ArrayNode) node.get("nonDefiningProperties");
      for (int i = 0; i < nonDefiningProperties.size(); i++) {
        ObjectNode nonDefiningProperty = (ObjectNode) nonDefiningProperties.get(i);
        if (nonDefiningProperty.has("identifierValue")) {
          JsonNode valueNode = nonDefiningProperty.get("identifierValue");
          nonDefiningProperty.set("value", valueNode);
          nonDefiningProperty.remove("identifierValue");
        }

        if (nonDefiningProperty.has("identifierValueObject")) {
          JsonNode valueObjectNode = nonDefiningProperty.get("identifierValueObject");
          nonDefiningProperty.set("valueObject", valueObjectNode);
          nonDefiningProperty.remove("identifierValueObject");
        }

        nonDefiningProperty.put("type", PropertyType.NON_DEFINING_PROPERTY.name());
        consolidatedProperties.add(nonDefiningProperty);
      }
      node.remove("nonDefiningProperties");
    }

    // Add the consolidated properties back to the node
    node.set("nonDefiningProperties", consolidatedProperties);
  }

  private static class ProductRecord {
    long id;
    String packageDetails;
    String originalPackageDetails;
  }
}
