-- Restore the original publication time for the pre-season creator aggregate.
-- Production's published_at was overwritten by an admin edit on 2026-08-10.
-- The original timestamp matches created_at in production and published_at in local D1.
-- Guards make this a no-op if the row has already been repaired or changed again.
UPDATE content
SET published_at = created_at
WHERE slug = 'what-wow-creators-think-is-strong-in-mythic-plus-for-midnight-season-2'
  AND page_type = 'post'
  AND status = 'published'
  AND created_at = 1786306498527
  AND published_at = 1786323460402;
