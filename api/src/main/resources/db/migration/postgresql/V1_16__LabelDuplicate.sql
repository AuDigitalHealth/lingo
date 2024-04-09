INSERT INTO label (version, created, modified, created_by, description, display_color, modified_by, name)
VALUES (
           0,                        -- version
           CURRENT_TIMESTAMP,        -- created
           CURRENT_TIMESTAMP,        -- modified
           'System',          -- created_by
           'A duplicated ticket - this ticket should be linked to the ticket it is a duplicate of', -- description
           'info',                -- display_color (hexadecimal color code for red)
           'System',          -- modified_by
           'Duplicate'               -- name
       );

