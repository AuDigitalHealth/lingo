ALTER TABLE product
    ADD COLUMN orignal_concept_id BIGINT;
ALTER TABLE product_aud
    ADD COLUMN orignal_concept_id BIGINT;

ALTER TABLE product
    ADD COLUMN original_package_details JSON;
ALTER TABLE product_aud
    ADD COLUMN original_package_details JSON;
