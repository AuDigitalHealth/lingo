alter table ticket_association DROP COLUMN ticket_id;
alter table ticket_association DROP COLUMN description;
alter table ticket_association_aud DROP COLUMN ticket_id;
alter table ticket_association_aud DROP COLUMN description;

ALTER TABLE ticket_association
    ADD COLUMN ticket_source_id bigint REFERENCES ticket;
ALTER TABLE ticket_association
    ADD COLUMN ticket_target_id bigint REFERENCES ticket;
ALTER TABLE ticket_association_aud
    ADD COLUMN ticket_source_id bigint REFERENCES ticket(id);
ALTER TABLE ticket_association_aud
    ADD COLUMN ticket_target_id bigint REFERENCES ticket(id);
