-- Renames the existing priority bucket labels: 1a -> 1, 1b -> 2, 2 -> 3, 3 -> 4.
-- Updated in reverse order_index so no intermediate UPDATE collides with the unique "name"
-- constraint (e.g. id=3 must vacate "2" before id=2 can take it).
UPDATE priority_bucket SET name = '4' WHERE id = 4 AND name = '3';
UPDATE priority_bucket SET name = '3' WHERE id = 3 AND name = '2';
UPDATE priority_bucket SET name = '2' WHERE id = 2 AND name = '1b';
UPDATE priority_bucket SET name = '1' WHERE id = 1 AND name = '1a';
