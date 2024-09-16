
DO $$
    DECLARE
        SYSTEM_USER CONSTANT TEXT := 'System';
        AMT_FLAGS CONSTANT TEXT := 'AMTFlags';
    BEGIN

        -- Insert into the state table with batch values
        INSERT INTO state (version, created, modified, created_by, modified_by, label)
        VALUES
            (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER, SYSTEM_USER, 'To Do'),
            (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER, SYSTEM_USER, 'Validation/First Review'),
            (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER, SYSTEM_USER, 'Closed'),
            (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER, SYSTEM_USER, 'Second Review/Author'),
            (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER, SYSTEM_USER, 'Reopened'),
            (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER, SYSTEM_USER, 'Review'),
            (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER, SYSTEM_USER, 'Resolved'),
            (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER, SYSTEM_USER, 'Awaiting Confirmation')
        ON CONFLICT (label) DO NOTHING;

-- Insert into the ticket_type table
        INSERT INTO ticket_type (version, created, modified, created_by, modified_by, name)
        VALUES
            (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER, SYSTEM_USER, 'Author Product')
        ON CONFLICT (name) DO NOTHING;

-- Insert into additional_field_type table with batch values
        INSERT INTO additional_field_type (version, created, modified, created_by, modified_by, name, description, type, display)
        VALUES
            (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER, SYSTEM_USER, 'InactiveDate', 'Inactive Date', 'DATE', true),
            (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER, SYSTEM_USER, AMT_FLAGS, 'AMT Flags', 'LIST', true),
            (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER, SYSTEM_USER, 'StartDate', 'ARTG Start Date', 'DATE', true),
            (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER, SYSTEM_USER, 'ARTGID', 'ARTG ID', 'NUMBER', true),
            (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER, SYSTEM_USER, 'DateRequested', 'Date Requested', 'DATE', true),
            (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER, SYSTEM_USER, 'EffectiveDate', 'Effective Date', 'DATE', true)
        ON CONFLICT (name) DO NOTHING;

-- Insert into the label table
        INSERT INTO label (version, created, modified, created_by, description, display_color, modified_by, name)
        VALUES
            (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER, 'The ticket was exported from Blue Jira', 'info', SYSTEM_USER, 'JiraExport')
        ON CONFLICT (name) DO NOTHING;

-- Insert into additional_field_value table using a subquery for the field type ID
        INSERT INTO additional_field_value (version, created, modified, created_by, modified_by, additional_field_type_id, value_of)
        SELECT
            0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER, SYSTEM_USER,
            (SELECT id FROM additional_field_type WHERE name = AMT_FLAGS), 'PBS'
        WHERE NOT EXISTS (
            SELECT 1 FROM additional_field_value
            WHERE additional_field_type_id = (SELECT id FROM additional_field_type WHERE name = AMT_FLAGS)
              AND value_of = 'PBS'
        );

    END $$;