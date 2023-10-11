ALTER TABLE additional_field_type
    ADD type varchar(255);

UPDATE additional_field_type set type='LIST' where list_type = true;

UPDATE additional_field_type set type='DATE' where LOWER(name) like '%date%';

UPDATE additional_field_type set type='NUMBER' where name = 'ARTGID';

