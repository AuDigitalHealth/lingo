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
import lombok.extern.java.Log;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

@Log
public abstract class BaseProductMigration extends BaseJavaMigration {
  private static final ObjectMapper objectMapper = new ObjectMapper();
  private static final String CONTAINED_PRODUCTS = "containedProducts";
  private static final String PRODUCT_DETAILS = "productDetails";
  private static final String CONTAINED_PACKAGES = "containedPackages";
  private static final String PACKAGE_DETAILS = "packageDetails";

  @Override
  public void migrate(Context context) throws Exception {
    Connection connection = context.getConnection();

    // Get all products
    List<ProductRecord> products = getAllProducts(connection);
    log.info("Found " + products.size() + " products to migrate");

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

        log.info("Successfully migrated product with ID: " + product.id);
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
    processNode(updatedPackageDetails);

    // Process any ProductDetails within containedProducts
    if (updatedPackageDetails.has(CONTAINED_PRODUCTS)
        && updatedPackageDetails.get(CONTAINED_PRODUCTS).isArray()) {
      ArrayNode containedProducts = (ArrayNode) updatedPackageDetails.get(CONTAINED_PRODUCTS);
      for (int i = 0; i < containedProducts.size(); i++) {
        JsonNode productQuantity = containedProducts.get(i);
        if (productQuantity.has(PRODUCT_DETAILS)) {
          ObjectNode productDetails = (ObjectNode) productQuantity.get(PRODUCT_DETAILS);
          processNode(productDetails);
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
          processNode(nestedPackageDetails);
        }
      }
    }

    return updatedPackageDetails;
  }

  protected abstract void processNode(ObjectNode updatedPackageDetails);

  protected static class ProductRecord {
    long id;
    String packageDetails;
    String originalPackageDetails;
  }
}
