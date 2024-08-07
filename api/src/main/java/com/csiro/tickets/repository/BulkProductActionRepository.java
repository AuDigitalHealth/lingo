package com.csiro.tickets.repository;

import com.csiro.tickets.models.BulkProductAction;
import com.drew.lang.annotations.NotNull;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;

public interface BulkProductActionRepository extends JpaRepository<BulkProductAction, Long> {
  List<BulkProductAction> findByTicketId(@NotNull Long ticketId);

  Optional<BulkProductAction> findByNameAndTicketId(@NonNull String name, @NonNull Long ticketId);

  @Query(
      value =
          "WITH cte AS ( "
              + "SELECT COALESCE( "
              + "(SELECT name "
              + "FROM bulk_product_action "
              + "WHERE ticket_id = :ticketId AND details ->> 'type' = 'brand-pack-size' AND details ->> 'brands' IS NOT NULL "
              + "ORDER BY id DESC "
              + "LIMIT 1), 'Bulk-Brand-0') AS name "
              + ") "
              + "SELECT 'Bulk-Brand-' || (CAST(SUBSTRING(name FROM 12) AS INTEGER) + 1) AS new_product_name "
              + "FROM cte",
      nativeQuery = true)
  String findNewBulkProductBrandName(@Param("ticketId") Long ticketId);

  @Query(
      value =
          "WITH cte AS ( "
              + "    SELECT COALESCE( "
              + "        (SELECT name "
              + "         FROM bulk_product_action "
              + "         WHERE ticket_id = :ticketId AND details ->> 'type' = 'brand-pack-size' AND details ->> 'packSizes' IS NOT NULL "
              + "         ORDER BY id DESC "
              + "         LIMIT 1), 'Bulk-Pack-Size-0') AS name "
              + ") "
              + "SELECT 'Bulk-Pack-Size-' || (CAST(SUBSTRING(name FROM 16) AS INTEGER) + 1)  AS NewProductName "
              + "FROM cte",
      nativeQuery = true)
  String findNewBulkProductPackSizeName(@Param("ticketId") Long ticketId);
}
