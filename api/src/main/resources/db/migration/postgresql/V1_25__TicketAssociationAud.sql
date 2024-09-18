-- Remove foreign key constraints from ticket_association_aud
ALTER TABLE ticket_association_aud DROP CONSTRAINT IF EXISTS ticket_association_aud_ticket_source_id_fkey;
ALTER TABLE ticket_association_aud DROP CONSTRAINT IF EXISTS ticket_association_aud_ticket_target_id_fkey;

-- Modify ticket_association_aud columns
ALTER TABLE ticket_association_aud ALTER COLUMN ticket_source_id DROP NOT NULL;
ALTER TABLE ticket_association_aud ALTER COLUMN ticket_target_id DROP NOT NULL;

-- Add a comment to explain the change
COMMENT ON TABLE ticket_association_aud IS 'Audit table for ticket_association. Foreign key constraints removed to allow deletion of tickets without violating referential integrity in the audit table.';