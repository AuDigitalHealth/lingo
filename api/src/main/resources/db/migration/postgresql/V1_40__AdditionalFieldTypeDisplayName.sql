-- Separate the user-facing label from the machine key. `name` stays the identifier
-- (unique, letters only, used for lookups, URL path variables and export preset config);
-- `display_name` is free text and is what the UI renders.
ALTER TABLE additional_field_type ADD COLUMN display_name varchar(255);
ALTER TABLE additional_field_type_aud ADD COLUMN display_name varchar(255);

-- COALESCE guards the nullable `name` column, which would otherwise fail the NOT NULL below.
UPDATE additional_field_type SET display_name = COALESCE(name, '');
UPDATE additional_field_type_aud SET display_name = name;

-- The _aud mirror stays nullable: envers writes delete-revision rows with null data columns.
ALTER TABLE additional_field_type ALTER COLUMN display_name SET NOT NULL;
