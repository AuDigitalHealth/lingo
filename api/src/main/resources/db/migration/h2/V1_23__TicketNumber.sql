ALTER TABLE ticket
    ADD COLUMN ticket_number varchar(255);

ALTER TABLE ticket_aud
    ADD COLUMN ticket_number varchar(255);

ALTER TABLE ticket
    ADD CONSTRAINT unique_ticket_number UNIQUE (ticket_number);
