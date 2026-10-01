-- Repair seconds-based page update timestamps without changing the edit instant.
-- Audited 2026-09-30: production about, development, and grim-dawn each had
-- 1786305397 (2026-08-09 19:56:37 UTC); all local page timestamps were valid.
-- Idempotent: millisecond values are outside this range and remain untouched.
UPDATE content
SET updated_at = updated_at * 1000
WHERE page_type = 'page'
  AND typeof(updated_at) = 'integer'
  AND updated_at BETWEEN 946684800 AND CAST(strftime('%s', 'now') AS INTEGER);
