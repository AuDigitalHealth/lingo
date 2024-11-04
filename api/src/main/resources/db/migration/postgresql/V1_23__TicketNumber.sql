ALTER TABLE ticket
    ADD COLUMN ticket_number varchar(255);
ALTER TABLE ticket_aud
    ADD COLUMN ticket_number varchar(255);


UPDATE ticket
SET ticket_number = CONCAT('AMT-', LPAD(id::text, 5, '0'))
WHERE ticket_number is null;


UPDATE ticket_aud
SET ticket_number = CONCAT('AMT-', LPAD(id::text, 5, '0'))
WHERE ticket_number is null;

ALTER TABLE ticket
    ADD CONSTRAINT unique_ticket_number UNIQUE (ticket_number);