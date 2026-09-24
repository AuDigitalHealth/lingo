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

import au.gov.digitalhealth.tickets.models.WorkIdentityReservation;
import jakarta.transaction.Transactional;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkIdentityReservationRepository
    extends JpaRepository<WorkIdentityReservation, Long> {

  /**
   * Attempts to claim a unit of work, returning whether this caller won.
   *
   * <p>Native {@code ON CONFLICT DO NOTHING} rather than a read-then-insert: the whole point is
   * that the check and the claim are a single atomic statement, so two concurrent callers cannot
   * both believe they are first. A JPA {@code save} preceded by an existence check would reopen
   * exactly the race this closes.
   *
   * @return 1 when this caller claimed the work, 0 when another caller already holds it
   */
  @Modifying
  @Transactional
  @Query(
      value =
          "INSERT INTO work_identity_reservation (scope, work_type, work_key, reserved_at) "
              + "VALUES (:scope, :workType, :workKey, now()) "
              + "ON CONFLICT (scope, work_type, work_key) DO NOTHING",
      nativeQuery = true)
  int tryClaim(
      @Param("scope") String scope,
      @Param("workType") String workType,
      @Param("workKey") String workKey);

  Optional<WorkIdentityReservation> findByScopeAndWorkTypeAndWorkKey(
      String scope, String workType, String workKey);

  /** Records the ticket the claim resolved to, so later callers can be pointed at it. */
  @Modifying
  @Transactional
  @Query(
      "UPDATE WorkIdentityReservation r SET r.ticketId = :ticketId "
          + "WHERE r.scope = :scope AND r.workType = :workType AND r.workKey = :workKey")
  int recordTicket(
      @Param("scope") String scope,
      @Param("workType") String workType,
      @Param("workKey") String workKey,
      @Param("ticketId") Long ticketId);
}
