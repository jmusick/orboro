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
  '707a72e8-ebc4-4f20-9cab-b8edacfa9b3f',
  'midnight-season-2-mythic-plus-interrupt-utility-cheat-sheet',
  'Midnight Season 2 Mythic+ Interrupt & Utility Cheat Sheet',
  'Midnight Season 2 Mythic+ dungeons ask every group to manage dangerous casts, stops, dispels, defensives, and crowd control. Use the complete, filterable guide below to decide what matters before the next pull; the Google Sheet is an alternative second-monitor view of the same data.

{{midnight_s2_interrupts}}',
  'page',
  'published',
  (SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1),
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  '/images/midnight-season-2-mythic-plus-interrupt-utility-cheat-sheet-header.png'
)
ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  markdown = excluded.markdown,
  page_type = excluded.page_type,
  status = excluded.status,
  published_at = COALESCE(content.published_at, excluded.published_at),
  updated_at = excluded.updated_at,
  featured_image_url = excluded.featured_image_url;

INSERT INTO nav_items (
  id,
  label,
  content_id,
  parent_item_id,
  sort_order,
  created_at
)
VALUES (
  '759300a9-d11b-4ef7-a7a0-c618960b01af',
  'Midnight S2 M+ Cheat Sheet',
  (SELECT id FROM content WHERE slug = 'midnight-season-2-mythic-plus-interrupt-utility-cheat-sheet'),
  (
    SELECT nav_items.id
    FROM nav_items
    INNER JOIN content ON content.id = nav_items.content_id
    WHERE content.slug = 'world-of-warcraft'
    LIMIT 1
  ),
  0,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
)
ON CONFLICT(id) DO UPDATE SET
  label = excluded.label,
  content_id = excluded.content_id,
  parent_item_id = excluded.parent_item_id,
  sort_order = excluded.sort_order;

UPDATE nav_items SET sort_order = 1
WHERE label = 'Assisted Combat Analysis'
  AND parent_item_id = (
    SELECT nav_items.id
    FROM nav_items
    INNER JOIN content ON content.id = nav_items.content_id
    WHERE content.slug = 'world-of-warcraft'
    LIMIT 1
  );

UPDATE nav_items SET sort_order = 2
WHERE label = 'Useful WoW Links'
  AND parent_item_id = (
    SELECT nav_items.id
    FROM nav_items
    INNER JOIN content ON content.id = nav_items.content_id
    WHERE content.slug = 'world-of-warcraft'
    LIMIT 1
  );

