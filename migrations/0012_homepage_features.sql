ALTER TABLE content ADD COLUMN homepage_featured INTEGER NOT NULL DEFAULT 0 CHECK (homepage_featured IN (0, 1));
ALTER TABLE content ADD COLUMN homepage_group TEXT NOT NULL DEFAULT 'other' CHECK (homepage_group IN ('wow', 'poe2', 'other'));
ALTER TABLE content ADD COLUMN homepage_order INTEGER NOT NULL DEFAULT 0 CHECK (homepage_order BETWEEN 0 AND 9999);
ALTER TABLE content ADD COLUMN homepage_description TEXT NOT NULL DEFAULT '';

CREATE INDEX content_homepage_idx ON content(page_type, status, homepage_featured, homepage_order);
