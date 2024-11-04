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
package au.gov.digitalhealth.tickets.repository;

import au.gov.digitalhealth.tickets.models.BulkProductAction;
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
