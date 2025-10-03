package au.gov.digitalhealth.lingo.db.migration;

import au.gov.digitalhealth.lingo.exception.LingoProblem;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
public abstract class BaseBulkProductMigration extends BaseJavaMigration {
  private static final ObjectMapper objectMapper = new ObjectMapper();

  @Override
  public void migrate(Context context) throws Exception {
    Connection connection = context.getConnection();

    // Get all bulk products
    List<BulkProductRecord> products = getAllProducts(connection);
    log.info("Found " + products.size() + " bulk products to migrate");

    // Process each product
    for (BulkProductRecord product : products) {
      try {
        // Parse the JSON
        JsonNode details = objectMapper.readTree(product.details);
        JsonNode updateDetails = updateDetails(details);

        // Save the updated JSON back to the database
        updateBulkProduct(connection, product.id, objectMapper.writeValueAsString(updateDetails));

        log.info("Successfully migrated bulk product with ID: " + product.id);
      } catch (Exception e) {
        throw new LingoProblem("Error migrating bulk product with ID:" + product.id, e);
      }
    }
  }

  private List<BulkProductRecord> getAllProducts(Connection connection) throws SQLException {
    List<BulkProductRecord> products = new ArrayList<>();

    try (PreparedStatement stmt =
        connection.prepareStatement("SELECT id, name, details FROM bulk_product_action")) {
      try (ResultSet rs = stmt.executeQuery()) {
        while (rs.next()) {
          BulkProductRecord product = new BulkProductRecord();
          product.id = rs.getLong("id");
          product.name = rs.getString("name");
          product.details = rs.getString("details");
          products.add(product);
        }
      }
    }

    return products;
  }

  private void updateBulkProduct(Connection connection, long id, String details)
      throws SQLException {
    boolean isPostgres = connection.getMetaData().getDatabaseProductName().contains("PostgreSQL");

    // SQL for PostgreSQL vs H2
    String sql;
    if (isPostgres) {
      sql = "UPDATE bulk_product_action SET details = CAST(? AS json)";
    } else {
      // For H2, just use normal parameters
      sql = "UPDATE bulk_product_action SET details = ?";
    }
    sql += " WHERE id = ?";

    try (PreparedStatement stmt = connection.prepareStatement(sql)) {
      stmt.setString(1, details);
      stmt.setLong(2, id);
      stmt.executeUpdate();
    }
  }

  private JsonNode updateDetails(JsonNode details) {
    ObjectNode updatedDetails = details.deepCopy();

    processNode(updatedDetails);

    return updatedDetails;
  }

  protected abstract void processNode(ObjectNode bulkDetails);

  protected static class BulkProductRecord {
    long id;
    String name;
    String details;
  }
}
