ALTER TABLE additional_field_type
    ADD COLUMN display BOOLEAN DEFAULT true;

-- Step 2: Update existing entries to set the default value
UPDATE additional_field_type
SET display = true
WHERE display IS NULL;

ALTER TABLE additional_field_type_aud
    ADD COLUMN display BOOLEAN DEFAULT true;

-- Step 2: Update existing entries to set the default value
UPDATE additional_field_type_aud
SET display = true
WHERE display IS NULL;