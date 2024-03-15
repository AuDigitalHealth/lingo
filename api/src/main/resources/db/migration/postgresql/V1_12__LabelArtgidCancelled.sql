INSERT INTO label (version, created, modified, created_by, description, display_color, modified_by, name)
VALUES (
           0,                        -- version
           CURRENT_TIMESTAMP,        -- created
           CURRENT_TIMESTAMP,        -- modified
           'System',          -- created_by
           'An entry in the tga feed that existed at one stage, but has now been removed and no longer exists.', -- description
           'info',                -- display_color (hexadecimal color code for red)
           'System',          -- modified_by
           'ARTG Cancelled'               -- name
       );

