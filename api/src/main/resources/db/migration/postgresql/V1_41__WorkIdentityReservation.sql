-- Arbitrates concurrent callers racing to create a ticket for the same unit of work.
--
-- Deduplication for register-derived tickets was previously three sequential reads with no lock:
-- two callers submitting the same ARTG ID could both find nothing and both create a ticket. The
-- nightly register scan and an interactive submission overlapping on one ARTG ID is exactly that
-- race, and it produced the duplicate tickets the "Duplicate" label exists to clean up after.
--
-- The unique constraint is the arbitration. A caller claims the work with
--   INSERT INTO work_identity_reservation (scope, work_type, work_key) VALUES (...)
--   ON CONFLICT DO NOTHING
-- and inserts exactly 0 or 1 rows; 0 means another caller already owns it, so this caller reuses
-- that ticket rather than creating a second one. This is a different concern from an idempotency
-- key, which de-duplicates one caller's own retries — this de-duplicates *distinct* callers
-- converging on the same work.
CREATE TABLE work_identity_reservation (
  id            bigserial    PRIMARY KEY,
  -- Namespace, so unrelated work types can reuse key values without colliding.
  scope         varchar(64)  NOT NULL,
  -- What kind of work this is, e.g. 'ARTG_TICKET'.
  work_type     varchar(64)  NOT NULL,
  -- The natural key within the scope, e.g. an ARTG licence ID.
  work_key      varchar(255) NOT NULL,
  -- Ticket that won the race. Nullable: the row is claimed before the ticket exists, then updated.
  ticket_id     bigint,
  reserved_at   timestamp    NOT NULL DEFAULT now(),
  CONSTRAINT uq_work_identity UNIQUE (scope, work_type, work_key)
);

-- Reservations are looked up by the ticket they resolved to when reconciling a batch result.
CREATE INDEX idx_work_identity_reservation_ticket ON work_identity_reservation (ticket_id);

COMMENT ON TABLE work_identity_reservation IS
  'Atomic claim on a unit of work, so concurrent callers converge on one ticket instead of each creating their own.';
