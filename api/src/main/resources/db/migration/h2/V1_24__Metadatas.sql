
DO $$
    DECLARE
SYSTEM_USER_H2 CONSTANT TEXT := 'System';
        AMT_FLAGS_H2 CONSTANT TEXT := 'AMTFlags';
BEGIN

        -- Insert into the state table with batch values
INSERT INTO state (version, created, modified, created_by, modified_by, label)
VALUES
    (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER_H2, SYSTEM_USER_H2, 'To Do'),
    (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER_H2, SYSTEM_USER_H2, 'Validation/First Review'),
    (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER_H2, SYSTEM_USER_H2, 'Closed'),
    (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER_H2, SYSTEM_USER_H2, 'Second Review/Author'),
    (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER_H2, SYSTEM_USER_H2, 'Reopened'),
    (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER_H2, SYSTEM_USER_H2, 'Review'),
    (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER_H2, SYSTEM_USER_H2, 'Resolved'),
    (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER_H2, SYSTEM_USER_H2, 'Awaiting Confirmation')
    ON CONFLICT (label) DO NOTHING;

-- Insert into the ticket_type table
INSERT INTO ticket_type (version, created, modified, created_by, modified_by, name)
VALUES
    (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER_H2, SYSTEM_USER_H2, 'Author Product')
    ON CONFLICT (name) DO NOTHING;

-- Insert into additional_field_type table with batch values
INSERT INTO additional_field_type (version, created, modified, created_by, modified_by, name, description, type, display)
VALUES
    (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER_H2, SYSTEM_USER_H2, 'InactiveDate', 'Inactive Date', 'DATE', true),
    (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER_H2, SYSTEM_USER_H2, SYSTEM_USER_H2, 'AMT Flags', 'LIST', true),
    (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER_H2, SYSTEM_USER_H2, 'StartDate', 'ARTG Start Date', 'DATE', true),
    (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER_H2, SYSTEM_USER_H2, 'ARTGID', 'ARTG ID', 'NUMBER', true),
    (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER_H2, SYSTEM_USER_H2, 'DateRequested', 'Date Requested', 'DATE', true),
    (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER_H2, SYSTEM_USER_H2, 'EffectiveDate', 'Effective Date', 'DATE', true)
    ON CONFLICT (name) DO NOTHING;

-- Insert into the label table
INSERT INTO label (version, created, modified, created_by, description, display_color, modified_by, name)
VALUES
    (0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER_H2, 'The ticket was exported from Blue Jira', 'info', SYSTEM_USER_H2, 'JiraExport')
    ON CONFLICT (name) DO NOTHING;

-- Insert into additional_field_value table using a subquery for the field type ID
INSERT INTO additional_field_value (version, created, modified, created_by, modified_by, additional_field_type_id, value_of)
SELECT
    0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SYSTEM_USER_H2, SYSTEM_USER_H2,
    (SELECT id FROM additional_field_type WHERE name = SYSTEM_USER_H2), 'PBS'
    WHERE NOT EXISTS (
            SELECT 1 FROM additional_field_value
            WHERE additional_field_type_id = (SELECT id FROM additional_field_type WHERE name = SYSTEM_USER_H2)
              AND value_of = 'PBS'
        );

END $$;