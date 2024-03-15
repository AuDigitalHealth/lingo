-- Create the table
CREATE TABLE ui_search_configuration (
                                         id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                         username VARCHAR(255) NOT NULL ,
                                         filter_id BIGINT,
                                         grouping INTEGER,
                                         created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                                         modified TIMESTAMP WITH TIME ZONE,
                                         created_by VARCHAR(255),
                                         modified_by VARCHAR(255),
                                         version INTEGER
);

CREATE TABLE ui_search_configuration_aud (
                                             rev INTEGER NOT NULL,
                                             revtype SMALLINT,
                                             id BIGINT NOT NULL,
                                             username VARCHAR(255),
                                             filter_id BIGINT,
                                             grouping INTEGER,
                                             version INTEGER,
                                             PRIMARY KEY (rev, id)
);

-- Add foreign key constraint
ALTER TABLE ui_search_configuration ADD CONSTRAINT fk_filter_id FOREIGN KEY (filter_id) REFERENCES ticket_filters(id);