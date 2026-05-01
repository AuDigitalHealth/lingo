ALTER TABLE additional_field_type ADD COLUMN shared_value BOOLEAN DEFAULT false;
ALTER TABLE additional_field_type_aud ADD COLUMN shared_value BOOLEAN DEFAULT false;

UPDATE additional_field_type SET shared_value = true WHERE name = 'ARTGID';
