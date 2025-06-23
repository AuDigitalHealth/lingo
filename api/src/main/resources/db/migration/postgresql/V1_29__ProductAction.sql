-- Add action column to product table
ALTER TABLE product ADD COLUMN action VARCHAR(255) NOT NULL DEFAULT 'CREATE';
ALTER TABLE product_aud ADD COLUMN action VARCHAR(255);

-- Set default value for existing records
UPDATE product SET action = 'CREATE' WHERE action IS NULL;
UPDATE product_aud SET action = 'CREATE' WHERE action IS NULL;