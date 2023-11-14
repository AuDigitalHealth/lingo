ALTER TABLE task_association
    ADD CONSTRAINT unique_ticket_id UNIQUE (ticket_id);

ALTER TABLE ticket
    ADD COLUMN task_association_id bigint REFERENCES task_association(id);

ALTER TABLE ticket_aud
    ADD COLUMN task_association_id bigint;