ALTER TABLE nav_items ADD COLUMN parent_item_id TEXT REFERENCES nav_items(id) ON DELETE CASCADE;
