-- Add custom template support for content rendering
ALTER TABLE content ADD COLUMN template_key TEXT;
ALTER TABLE content ADD COLUMN template_data_json TEXT;

UPDATE content
SET template_key = CASE
  WHEN page_type = 'post' THEN 'post-default'
  ELSE 'page-default'
END
WHERE template_key IS NULL;
