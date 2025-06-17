ALTER TABLE product
    ADD COLUMN original_concept_id BIGINT;
ALTER TABLE product_aud
    ADD COLUMN original_concept_id BIGINT;

ALTER TABLE product
    ADD COLUMN original_package_details JSONB;
ALTER TABLE product_aud
    ADD COLUMN original_package_details JSONB;