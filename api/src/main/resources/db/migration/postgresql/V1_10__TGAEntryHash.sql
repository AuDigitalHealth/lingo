UPDATE additional_field_type
SET display = true
WHERE display IS false;

UPDATE additional_field_type_aud
SET display = true
WHERE display IS false;

insert into "additional_field_type" ("created", "created_by", "description", "id", "modified", "modified_by", "name", "version", "type", "display") values ('2024-02-14 09:15:06.168515+10', 'System', 'The Hash Created From an Entry in the TGA Feed', '7', '2024-02-14 09:15:06.168515+10', 'System', 'TGAEntryHash', 0, 'STRING', false);