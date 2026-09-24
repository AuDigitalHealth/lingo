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
package au.gov.digitalhealth.tickets.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * An atomic claim on a unit of work, used to arbitrate concurrent callers.
 *
 * <p>Deduplicating register-derived tickets by reading first and creating second is not safe under
 * concurrency: two callers submitting the same ARTG ID can both read "no ticket" and both create
 * one. The unique constraint on {@code (scope, workType, workKey)} makes the claim atomic, so
 * exactly one caller proceeds to create and the rest reuse its ticket.
 *
 * <p>Distinct from an idempotency key: that de-duplicates one caller's retries of the same request,
 * whereas this arbitrates between different callers arriving at the same work independently.
 *
 * <p>Not audited — this is coordination state, not ticket content, and its history has no business
 * meaning.
 */
@Entity
@Table(name = "work_identity_reservation")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkIdentityReservation {

  /** Namespace, so unrelated work types can reuse key values without colliding. */
  public static final String SCOPE_TICKETS = "tickets";

  /** Work type for a register-derived submission ticket. */
  public static final String TYPE_ARTG_TICKET = "ARTG_TICKET";

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "scope", nullable = false, length = 64)
  private String scope;

  @Column(name = "work_type", nullable = false, length = 64)
  private String workType;

  @Column(name = "work_key", nullable = false)
  private String workKey;

  /** Ticket that won the race. Null between claiming the work and creating the ticket. */
  @Column(name = "ticket_id")
  private Long ticketId;

  @Column(name = "reserved_at", nullable = false)
  private Instant reservedAt;
}
