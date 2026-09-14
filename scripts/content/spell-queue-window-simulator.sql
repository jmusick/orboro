PRAGMA foreign_keys = ON;


INSERT INTO content (
  id,
  slug,
  title,
  markdown,
  page_type,
  status,
  author_id,
  published_at,
  created_at,
  updated_at,
  featured_image_url
)
VALUES (
  '508157dc-c92d-464b-b4d3-05a2dd5f5e5c',
  'spell-queue-window-simulator',
  'Spell Queue Window Guide & Simulator',
  'World of Warcraft can queue your next ability shortly before the current global cooldown finishes. This guide explains what the Spell Queue Window does and does not change, then hands you an interactive simulator to see how your queue size, GCD, latency, and keypress rhythm combine to create or prevent rotational gaps.

{{spell_queue_lab}}',
  'page',
  'published',
  (SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1),
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  NULL
)
ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  markdown = excluded.markdown,
  page_type = excluded.page_type,
  status = excluded.status,
  published_at = COALESCE(content.published_at, excluded.published_at),
  updated_at = excluded.updated_at,
  featured_image_url = excluded.featured_image_url;

INSERT OR IGNORE INTO content_categories (content_id, category_id)
SELECT
  (SELECT id FROM content WHERE slug = 'spell-queue-window-simulator'),
  id
FROM categories
WHERE slug IN ('gaming', 'world-of-warcraft');

INSERT INTO nav_items (
  id,
  label,
  content_id,
  parent_item_id,
  sort_order,
  created_at
)
VALUES (
  'b60b2706-d1c6-4d65-99e1-d669a4eb7acb',
  'Spell Queue Window Guide',
  (SELECT id FROM content WHERE slug = 'spell-queue-window-simulator'),
  (
    SELECT nav_items.id
    FROM nav_items
    INNER JOIN content ON content.id = nav_items.content_id
    WHERE content.slug = 'world-of-warcraft'
    LIMIT 1
  ),
  2,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
)
ON CONFLICT(id) DO UPDATE SET
  label = excluded.label,
  content_id = excluded.content_id,
  parent_item_id = excluded.parent_item_id,
  sort_order = excluded.sort_order;

UPDATE nav_items SET sort_order = 3
WHERE label = 'Useful WoW Links'
  AND parent_item_id = (
    SELECT nav_items.id
    FROM nav_items
    INNER JOIN content ON content.id = nav_items.content_id
    WHERE content.slug = 'world-of-warcraft'
    LIMIT 1
  );

