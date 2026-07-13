import { generateExpeditionRumourSheet } from "./expedition-rumours";
import { generateAtlasFarmingStrategies } from "./atlas-farming-strategies";

const SHORTCODES: Record<string, () => string> = {
  rumour_cheat_sheet: generateExpeditionRumourSheet,
  atlas_farming_strategies: generateAtlasFarmingStrategies,
};

// Replaces {{token}} shortcodes in rendered HTML.
// marked wraps a standalone token in <p>…</p>, so we strip that wrapper too.
export function processShortcodes(html: string): string {
  return html.replace(/<p>\s*\{\{(\w+)\}\}\s*<\/p>|\{\{(\w+)\}\}/g, (_match, t1, t2) => {
    const token = t1 ?? t2;
    const fn = SHORTCODES[token];
    return fn ? fn() : _match;
  });
}
