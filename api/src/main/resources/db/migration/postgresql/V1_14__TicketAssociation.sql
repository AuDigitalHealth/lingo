ALTER table ticket_association drop column ticket_id;
ALTER table ticket_association ADD COLUMN ticket_source_id bigint references ticket;
ALTER table ticket_association ADD COLUMN ticket_target_id bigint references ticket;

ALTER table ticket_association_aud drop column ticket_id;
ALTER table ticket_association_aud ADD COLUMN ticket_source_id bigint references ticket(id);
ALTER table ticket_association_aud ADD COLUMN ticket_target_id bigint references ticket(id);