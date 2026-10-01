-- Safe to repeat locally or remotely; only replace the known stale copy.
-- Preserve unrelated prose and environment-specific image URLs.
UPDATE content
SET markdown = REPLACE(markdown, 'Cloudflare Pages and D1', 'a Cloudflare Worker with D1'),
    updated_at = unixepoch() * 1000
WHERE slug = 'development' AND page_type = 'page'
  AND instr(markdown, 'Cloudflare Pages and D1') > 0;

UPDATE content
SET markdown = REPLACE(markdown,
'Right now that means action RPGs. I''m currently deep into [Path of Exile II](/pages/path-of-exile-ii), where I''ve put together farming strategies, a cheat sheet, and a running list of useful tools. I also spend time in [Grim Dawn](/pages/grim-dawn), Crate Entertainment''s dark fantasy ARPG, with its own small collection of [useful links](/pages/useful-grim-dawn-links).',
'The [World of Warcraft](/pages/world-of-warcraft) section includes Mythic+ guides, interrupt cheat sheets, and assisted-combat analysis. For [Path of Exile II](/pages/path-of-exile-ii), you can find farming strategies, an expedition cheat sheet, and useful tools. The [Grim Dawn](/pages/grim-dawn) section collects resources for Crate Entertainment''s dark fantasy ARPG, including [useful links](/pages/useful-grim-dawn-links).'),
    updated_at = unixepoch() * 1000
WHERE slug = 'gaming' AND page_type = 'page'
  AND instr(markdown, 'Right now that means action RPGs. I''m currently deep into [Path of Exile II]') > 0
  AND instr(markdown, 'with its own small collection of [useful links](/pages/useful-grim-dawn-links).') > 0;
