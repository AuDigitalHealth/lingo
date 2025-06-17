-- Migration for ExternalProcess table
CREATE TABLE external_process
(
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    version      INTEGER,
    process_name VARCHAR(255) NOT NULL,
    enabled      BOOLEAN      NOT NULL,
    created      TIMESTAMP    NOT NULL,
    modified     TIMESTAMP,
    created_by   VARCHAR(255),
    modified_by  VARCHAR(255)
);

-- Migration for ExternalProcess audit table (external_process_aud)
CREATE TABLE external_process_aud
(
    rev          INTEGER NOT NULL,
    revtype      SMALLINT,
    id           BIGINT  NOT NULL,
    process_name VARCHAR(255),
    enabled      BOOLEAN,
    created      TIMESTAMP,
    modified     TIMESTAMP,
    created_by   VARCHAR(255),
    modified_by  VARCHAR(255),
    PRIMARY KEY (id, rev)
);
