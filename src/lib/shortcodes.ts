import { generateExpeditionRumourSheet } from "./expedition-rumours";
import { generateAtlasFarmingStrategies } from "./atlas-farming-strategies";
import { generateBookmarksList } from "./bookmarks";
import { generatePoe2Featured, generatePoe2Intro } from "./poe2-featured";

type ShortcodeFn = (attrs: Record<string, string>) => string | Promise<string>;

const SHORTCODES: Record<string, ShortcodeFn> = {
  rumour_cheat_sheet: generateExpeditionRumourSheet,
  atlas_farming_strategies: generateAtlasFarmingStrategies,
  bookmarks: generateBookmarksList,
  poe2_featured: generatePoe2Featured,
  poe2_intro: generatePoe2Intro,
};

// Matches {{token}} or {{token attr="value" ...}}. marked wraps a standalone
// token in <p>…</p>, so both the wrapped and bare forms are captured. Attrs
// are captured loosely (up to the closing "}}") because marked HTML-escapes
// the quotes in paragraph text before this runs.
const SHORTCODE_RE = /<p>\s*\{\{(\w+)([^}]*)\}\}\s*<\/p>|\{\{(\w+)([^}]*)\}\}/g;

function parseAttrs(raw: string): Record<string, string> {
  const decoded = raw
    .replace(/&quot;/g, '"')
    .replace(/&#0*34;|&#x0*22;/gi, '"')
    .replace(/&amp;/g, "&");
  const attrs: Record<string, string> = {};
  const attrRe = /([\w-]+)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(decoded))) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}

// Replaces shortcode tokens in rendered HTML with their generated content.
export async function processShortcodes(html: string): Promise<string> {
  const matches = [...html.matchAll(SHORTCODE_RE)];
  if (matches.length === 0) return html;

  const results = await Promise.all(matches.map(async (match) => {
    const token = match[1] ?? match[3];
    const attrsRaw = match[2] ?? match[4] ?? "";
    const fn = SHORTCODES[token];
    return fn ? await fn(parseAttrs(attrsRaw)) : match[0];
  }));

  let i = 0;
  return html.replace(SHORTCODE_RE, () => results[i++]);
}
