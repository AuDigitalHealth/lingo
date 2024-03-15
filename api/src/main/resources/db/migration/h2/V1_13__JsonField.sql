-- Create table for JsonField entity
CREATE TABLE json_field (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    ticket_id BIGINT,
    value JSON,
    created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMP,
    created_by VARCHAR(255),
    modified_by VARCHAR(255),
    FOREIGN KEY (ticket_id) REFERENCES ticket(id),
    UNIQUE (name, ticket_id) -- Define composite unique constraint
);

-- Create audit table for JsonField entity
CREATE TABLE json_field_aud (
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    id BIGINT NOT NULL,
    name VARCHAR(255),
    ticket_id BIGINT,
    value JSON,
    created TIMESTAMP,
    modified TIMESTAMP,
    created_by VARCHAR(255),
    modified_by VARCHAR(255),
    PRIMARY KEY (rev, id)
);