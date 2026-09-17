-- Seed data for exercising the "Is Not Blank" / "Is Blank" due date filter (issue #1961).
--
-- The filter is only convincing against a backlog where some tickets carry a due date and some do
-- not, spread across states. Six of each are written here, because a round count makes a wrong
-- result obvious at a glance: "Is Not Blank" must return exactly six rows, "Is Blank" the other six.
--
-- Each title says which side of the filter the ticket belongs on, and the description says what the
-- reviewer should see, so the test is to apply the filter and compare.
--
-- Re-runnable. Everything it writes lives at id >= 9000 (rev >= 9000 for revinfo), and the teardown
-- at the top removes exactly that range, so rows created through the app are never touched.
--
-- Run it with scripts/seed/seed-local-db.sh, or directly:
--   psql "postgresql://postgres@localhost:5431/snomio" -f scripts/seed/due-date-blank-filter-seed.sql
--
-- Timestamps are written at +10 (Australia/Brisbane, the default snomio.timezone) around midday, so
-- the calendar day they render on does not depend on how the reader's zone is configured.
--
-- Note on the Created column: it offers no blank match modes, because ticket.created is NOT NULL.
-- Neither mode could tell one ticket from another there, so there is no seed case for it.

\set ON_ERROR_STOP on

BEGIN;

-- ---------------------------------------------------------------------------------------------
-- Teardown. Ordered so no foreign key is left dangling; revinfo goes last because every audit
-- mirror points at it.
-- ---------------------------------------------------------------------------------------------
DELETE FROM ticket_external_requestors_aud     WHERE ticket_id >= 9000;
DELETE FROM ticket_external_requestors         WHERE ticket_id >= 9000;
DELETE FROM ticket_labels_aud                  WHERE ticket_id >= 9000;
DELETE FROM ticket_labels                      WHERE ticket_id >= 9000;
DELETE FROM ticket_additional_field_values_aud WHERE ticket_id >= 9000;
DELETE FROM ticket_additional_field_values     WHERE ticket_id >= 9000;
DELETE FROM additional_field_value             WHERE id >= 9000;
DELETE FROM ticket_aud                         WHERE id >= 9000;
DELETE FROM ticket                             WHERE id >= 9000;
DELETE FROM revinfo                            WHERE rev >= 9000;

-- ---------------------------------------------------------------------------------------------
-- Tickets.
--
-- State and ticket type are resolved by label rather than hardcoded, so the seed survives a
-- database whose ids differ from a freshly migrated one.
--
-- Due dates sit either side of 2026-09-15 on purpose: one overdue, one due that day and four
-- later. That keeps "Date Before" and "Date After" meaningful on the same fixture, so a reviewer
-- can check the new modes did not disturb the ones already there.
-- ---------------------------------------------------------------------------------------------
INSERT INTO ticket
    (id, version, ticket_number, title, description, assignee, due_date,
     state_id, ticket_type_id, priority_bucket_id, created, modified, created_by, modified_by)
SELECT v.id, 0, v.ticket_number, v.title, v.description, v.assignee, v.due_date,
       (SELECT id FROM state WHERE label = v.state_label),
       (SELECT id FROM ticket_type ORDER BY id LIMIT 1),
       (SELECT id FROM priority_bucket WHERE name = v.priority),
       v.created, v.created, 'seed', 'seed'
FROM (VALUES
    -- Has a due date: the six rows "Is Not Blank" must return.
    (9201::bigint, 'AMT-009201',
     'Has a due date: overdue',
     'Due 14/08/2026, before today. Expect this under Due Date "Is Not Blank", and also under "Date Before" today.',
     'cgillespie', DATE '2026-08-14', 'To Do', '1', TIMESTAMPTZ '2026-07-01 12:00+10'),

    (9202::bigint, 'AMT-009202',
     'Has a due date: due today',
     'Due 15/09/2026. Expect this under Due Date "Is Not Blank". It is the boundary row for "Date Before" and "Date After".',
     'cgillespie', DATE '2026-09-15', 'To Do', '1', TIMESTAMPTZ '2026-08-03 12:00+10'),

    (9203::bigint, 'AMT-009203',
     'Has a due date: due later this month',
     'Due 30/09/2026. Expect this under Due Date "Is Not Blank", and under "Date After" today.',
     'jsmith', DATE '2026-09-30', 'Review', '2', TIMESTAMPTZ '2026-08-11 12:00+10'),

    (9204::bigint, 'AMT-009204',
     'Has a due date: due next month',
     'Due 15/10/2026. Expect this under Due Date "Is Not Blank".',
     'jsmith', DATE '2026-10-15', 'Second Review/Author', '2', TIMESTAMPTZ '2026-08-19 12:00+10'),

    (9205::bigint, 'AMT-009205',
     'Has a due date: due in December',
     'Due 01/12/2026. Expect this under Due Date "Is Not Blank".',
     NULL, DATE '2026-12-01', 'Awaiting Confirmation', '3', TIMESTAMPTZ '2026-09-01 12:00+10'),

    -- Closed but dated. This is the row that makes the reporter's real question - "open tickets
    -- that are waiting to be completed" - need a state filter alongside the due date one.
    (9206::bigint, 'AMT-009206',
     'Has a due date: already closed',
     'Due 20/09/2026 but Closed. Expect this under "Is Not Blank" on its own, and expect it to drop out once State is also filtered to the open states.',
     'cgillespie', DATE '2026-09-20', 'Closed', '1', TIMESTAMPTZ '2026-06-15 12:00+10'),

    -- No due date: the six rows "Is Blank" must return.
    (9207::bigint, 'AMT-009207',
     'No due date: waiting on triage',
     'No due date. Expect this under Due Date "Is Blank", and expect it to be absent from "Is Not Blank".',
     NULL, NULL, 'To Do', NULL, TIMESTAMPTZ '2026-09-02 12:00+10'),

    (9208::bigint, 'AMT-009208',
     'No due date: in review',
     'No due date. Expect this under Due Date "Is Blank".',
     'jsmith', NULL, 'Review', '2', TIMESTAMPTZ '2026-08-25 12:00+10'),

    (9209::bigint, 'AMT-009209',
     'No due date: reopened',
     'No due date. Expect this under Due Date "Is Blank".',
     'cgillespie', NULL, 'Reopened', '3', TIMESTAMPTZ '2026-07-14 12:00+10'),

    (9210::bigint, 'AMT-009210',
     'No due date: closed',
     'No due date and Closed. Expect this under Due Date "Is Blank" on its own, and expect it to drop out once State is also filtered to the open states.',
     NULL, NULL, 'Closed', '4', TIMESTAMPTZ '2026-05-06 12:00+10'),

    (9211::bigint, 'AMT-009211',
     'No due date: resolved',
     'No due date. Expect this under Due Date "Is Blank".',
     'jsmith', NULL, 'Resolved', '4', TIMESTAMPTZ '2026-06-30 12:00+10'),

    (9212::bigint, 'AMT-009212',
     'No due date: first review',
     'No due date. Expect this under Due Date "Is Blank".',
     NULL, NULL, 'Validation/First Review', NULL, TIMESTAMPTZ '2026-09-08 12:00+10')
) AS v(id, ticket_number, title, description, assignee, due_date, state_label, priority, created);

COMMIT;
